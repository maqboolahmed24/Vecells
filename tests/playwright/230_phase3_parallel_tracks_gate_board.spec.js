import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "230_phase3_parallel_tracks_gate_board.html");
const REGISTRY_PATH = path.join(ROOT, "data", "contracts", "230_phase3_track_readiness_registry.json");
const DEPENDENCY_MAP_PATH = path.join(ROOT, "data", "contracts", "230_phase3_dependency_interface_map.yaml");
const CONSISTENCY_MATRIX_PATH = path.join(ROOT, "data", "analysis", "230_phase3_contract_consistency_matrix.csv");
const OWNER_MATRIX_PATH = path.join(ROOT, "data", "analysis", "230_phase3_track_owner_matrix.csv");
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "230_phase3_parallel_gap_log.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase3ParallelGateBoardCoverage = [
  "Phase3_Parallel_Gate_Board",
  "track selection sync",
  "filter synchronization",
  "readiness state rendering",
  "blocked and deferred explanation rendering",
  "keyboard traversal and landmarks",
  "reduced-motion equivalence",
  "graph/table parity",
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
  for (const filePath of [
    HTML_PATH,
    REGISTRY_PATH,
    DEPENDENCY_MAP_PATH,
    CONSISTENCY_MATRIX_PATH,
    OWNER_MATRIX_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_230 artifact ${filePath}`);
  }

  return {
    registry: JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")),
    dependencyMap: JSON.parse(fs.readFileSync(DEPENDENCY_MAP_PATH, "utf8")),
    consistencyRows: parseCsv(fs.readFileSync(CONSISTENCY_MATRIX_PATH, "utf8")),
    ownerRows: parseCsv(fs.readFileSync(OWNER_MATRIX_PATH, "utf8")),
    gapLog: JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8")),
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/230_phase3_parallel_tracks_gate_board.html";
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
          : extension === ".json" || extension === ".yaml"
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
        reject(new Error("Unable to bind local seq_230 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/230_phase3_parallel_tracks_gate_board.html`,
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
  await page.locator("[data-testid='Phase3_Parallel_Gate_Board']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertMetrics(page, expected) {
  assertCondition(
    Number((await page.locator("[data-testid='metric-ready-count']").innerText()).trim()) ===
      expected.registry.summary.readyTrackCount,
    "Ready metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-deferred-count']").innerText()).trim()) ===
      expected.registry.summary.deferredTrackCount,
    "Deferred metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-blocked-count']").innerText()).trim()) ===
      expected.registry.summary.blockedTrackCount,
    "Blocked metric drifted.",
  );
}

async function assertTrackSelectionSync(page) {
  await page.locator("[data-testid='status-filter']").selectOption("ready");
  await page.getByTestId("track-button-par_233").click();
  assertCondition(
    (await page.locator("[data-testid='readiness-row-par_233']").getAttribute("data-selected")) === "true",
    "Readiness matrix did not synchronize with the selected track.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Deterministic queue engine"),
    "Inspector banner did not update for the selected track.",
  );
  const dependencyText = await page.locator("[data-testid='dependency-table']").innerText();
  assertCondition(
    dependencyText.includes("par_231") && dependencyText.includes("par_232"),
    "Dependency table did not synchronize with merge-time sibling interfaces.",
  );
}

async function assertFilterSynchronization(page) {
  await page.locator("[data-testid='status-filter']").selectOption("blocked");
  await page.locator("[data-testid='owner-filter']").selectOption("par_252");
  const visibleText = await page.locator("#visible-track-count").innerText();
  assertCondition(visibleText.includes("1"), "Filter synchronization did not reduce the visible rail.");
  const readinessText = await page.locator("[data-testid='readiness-matrix']").innerText();
  assertCondition(readinessText.includes("par_252"), "Readiness matrix did not honor owner filter.");
  assertCondition(!readinessText.includes("par_253"), "Readiness matrix did not narrow to the selected owner.");
}

async function assertReadinessStateRendering(page) {
  await page.locator("[data-testid='status-filter']").selectOption("all");
  await page.locator("[data-testid='owner-filter']").selectOption("all");
  await page.locator("[data-testid='family-filter']").selectOption("all");
  await page.locator("[data-testid='chain-filter']").selectOption("all");
  const matrixText = await page.locator("[data-testid='readiness-matrix']").innerText();
  assertCondition(
    matrixText.includes("ready") && matrixText.includes("deferred") && matrixText.includes("blocked"),
    "Readiness matrix does not render all status classes.",
  );
}

async function assertBlockedAndDeferredExplanationRendering(page) {
  await page.locator("[data-testid='status-filter']").selectOption("blocked");
  await page.getByTestId("track-button-par_252").click();
  assertCondition(
    (await page.locator("#inspector-readiness-reason").innerText()).includes("prompt/252.md"),
    "Blocked track explanation did not render the prompt-body reason.",
  );

  await page.locator("[data-testid='status-filter']").selectOption("deferred");
  await page.getByTestId("track-button-par_238").click();
  assertCondition(
    (await page.locator("#inspector-readiness-reason").innerText()).includes("first-wave evidence"),
    "Deferred track explanation did not render the upstream runtime reason.",
  );
}

async function assertKeyboardTraversalAndLandmarks(page) {
  await page.locator("[data-testid='status-filter']").selectOption("ready");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const activeRole = await page.evaluate(() => document.activeElement?.getAttribute("class") || "");
  assertCondition(
    activeRole.includes("track-button") || activeRole.includes("readiness-button"),
    "Keyboard traversal did not reach interactive track controls.",
  );
  await page.keyboard.press("ArrowDown");
  const summaryText = await page.locator("#summary-selected-track").innerText();
  assertCondition(summaryText.includes("par_"), "Arrow navigation did not retain a selected track.");
  const mainCount = await page.locator("main").count();
  const navCount = await page.locator("nav[aria-label='Track rail']").count();
  const asideCount = await page.locator("aside[aria-label='Launch packet inspector']").count();
  assertCondition(mainCount === 1 && navCount === 1 && asideCount === 1, "Landmarks drifted.");
}

async function assertReducedMotionEquivalence(browserType, url) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await openBoard(page, url);
  assertCondition(
    (await page.evaluate(() => document.documentElement.dataset.motion)) === "reduced",
    "Reduced-motion state was not recorded.",
  );
  const selectedText = await page.locator("#selection-banner-title").innerText();
  assertCondition(selectedText.length > 0, "Reduced-motion mode dropped selected-track meaning.");
  await screenshot(page, "output/playwright/230-phase3-parallel-tracks-gate-board-reduced.png");
  await context.close();
  await browser.close();
}

async function assertGraphTableParity(page, expected) {
  await page.locator("[data-testid='status-filter']").selectOption("ready");
  await page.getByTestId("track-button-par_235").click();
  const dependencyRows = await page.locator("[data-testid='dependency-table'] tbody tr").count();
  const interfaceCount = expected.dependencyMap.interfaces.filter(
    (entry) => entry.producerTask === "par_235" || entry.consumerTasks.includes("par_235"),
  ).length;
  assertCondition(
    dependencyRows >= interfaceCount,
    "Dependency table no longer provides parity for the selected track interfaces.",
  );
  const chainRows = await page.locator("[data-testid='invalidation-table'] tbody tr").count();
  assertCondition(
    chainRows === expected.dependencyMap.invalidationChains.length,
    "Invalidation table count drifted from the dependency map.",
  );
}

async function run() {
  const expected = loadExpected();
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { chromium } = playwright;
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1540, height: 1320 } });
    const page = await context.newPage();
    await openBoard(page, url);
    await assertMetrics(page, expected);
    await assertTrackSelectionSync(page);
    await assertFilterSynchronization(page);
    await assertReadinessStateRendering(page);
    await assertBlockedAndDeferredExplanationRendering(page);
    await assertKeyboardTraversalAndLandmarks(page);
    await assertGraphTableParity(page, expected);
    await screenshot(page, "output/playwright/230-phase3-parallel-tracks-gate-board-default.png");
    await context.close();
    await assertReducedMotionEquivalence(chromium, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
