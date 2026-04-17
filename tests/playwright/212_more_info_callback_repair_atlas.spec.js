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
  "212_more_info_callback_repair_state_atlas.html",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "212_more_info_cycle_callback_repair_matrix.csv",
);
const CASES_PATH = path.join(ROOT, "data", "analysis", "212_callback_repair_blocker_cases.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const responseContinuityAtlasCoverage = [
  "Response_Continuity_Atlas",
  "StateGallery",
  "ThreadAnatomyBoard",
  "BlockerDominanceMatrix",
  "RequestShellChildRouteDiagram",
  "MessageShellCallbackRepairDiagram",
  "ContinuityEvidenceShelf",
  "active reply-needed screenshot",
  "reply submitted awaiting review screenshot",
  "late review screenshot",
  "expired cycle with recovery screenshot",
  "callback expected screenshot",
  "callback window at risk screenshot",
  "callback completed screenshot",
  "repair required screenshot",
  "consent checkpoint required screenshot",
  "public-safe placeholder screenshot",
  "ARIA snapshots for state boards",
  "keyboard reachability",
  "disclosure reachability",
  "code reference focus",
  "reduced motion",
  "mobile rendering",
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
  for (const filePath of [HTML_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 212 artifact ${filePath}`);
  }
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  assertCondition(html.includes("Response_Continuity_Atlas"), "Atlas visual mode missing.");
  assertCondition(matrix.length >= 10, "Matrix needs all critical response states.");
  assertCondition(cases.cases.length >= 6, "Callback and repair cases missing.");
  return { matrix, cases };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/212_more_info_callback_repair_state_atlas.html";
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
        reject(new Error("Unable to bind local task 212 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/212_more_info_callback_repair_state_atlas.html`,
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
  await page.locator("[data-testid='Response_Continuity_Atlas']").waitFor();
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
    "StateGallery",
    "ThreadAnatomyBoard",
    "BlockerDominanceMatrix",
    "RequestShellChildRouteDiagram",
    "MessageShellCallbackRepairDiagram",
    "ContinuityEvidenceShelf",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function assertScreenshots(page) {
  const shots = [
    ["active-reply-needed", "output/playwright/212-active-reply-needed.png"],
    [
      "reply-submitted-awaiting-review",
      "output/playwright/212-reply-submitted-awaiting-review.png",
    ],
    ["late-review", "output/playwright/212-late-review.png"],
    ["expired-cycle-recovery", "output/playwright/212-expired-cycle-recovery.png"],
    ["callback-expected", "output/playwright/212-callback-expected.png"],
    ["callback-window-at-risk", "output/playwright/212-callback-window-at-risk.png"],
    ["callback-completed", "output/playwright/212-callback-completed.png"],
    ["repair-required", "output/playwright/212-repair-required.png"],
    ["consent-checkpoint-required", "output/playwright/212-consent-checkpoint-required.png"],
    ["public-safe-placeholder", "output/playwright/212-public-safe-placeholder.png"],
  ];
  for (const [scenarioId, outputPath] of shots) {
    await selectScenario(page, scenarioId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
}

async function assertAriaSnapshots(page) {
  await selectScenario(page, "repair-required");
  const stateSnapshot = await page.locator("[data-testid='StateGallery']").ariaSnapshot();
  const threadSnapshot = await page.locator("[data-testid='ThreadAnatomyBoard']").ariaSnapshot();
  const blockerSnapshot = await page
    .locator("[data-testid='BlockerDominanceMatrix']")
    .ariaSnapshot();
  for (const token of ["More-info cycle", "repair_required", "Contact repair"]) {
    assertCondition(stateSnapshot.includes(token), `State ARIA missing ${token}`);
  }
  for (const token of [
    "PatientMoreInfoStatusProjection",
    "PatientMoreInfoResponseThreadProjection",
  ]) {
    assertCondition(threadSnapshot.includes(token), `Thread ARIA missing ${token}`);
  }
  for (const token of ["Consent", "Reachability", "contact_route_repair"]) {
    assertCondition(blockerSnapshot.includes(token), `Blocker ARIA missing ${token}`);
  }
}

async function assertKeyboardAndDisclosure(page) {
  await page.locator("[data-scenario-button='active-reply-needed']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page
      .locator("[data-scenario-button='reply-submitted-awaiting-review']")
      .getAttribute("aria-selected")) === "true",
    "ArrowRight did not move scenario selection.",
  );
  await page.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  await page.locator("#projectionRefs").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "projectionRefs",
    "Code reference was not keyboard focusable.",
  );
}

async function assertAccessibilityStructure(page) {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  for (const label of [
    "Response states",
    "State gallery",
    "Thread anatomy board",
    "Blocker dominance matrix",
    "Request shell child-route diagram",
    "Message shell callback repair diagram",
    "Continuity evidence shelf",
  ]) {
    assertCondition(
      (await page.locator(`[aria-label='${label}']`).count()) >= 1,
      `Missing aria-label ${label}`,
    );
  }
}

async function assertDataParity(page, expected) {
  const embedded = await page.evaluate(() => window.__responseContinuityAtlasData);
  assertCondition(embedded.visualMode === "Response_Continuity_Atlas", "Visual mode drifted.");
  assertCondition(embedded.scenarios.length === 10, "Expected ten atlas scenarios.");
  for (const projection of [
    "PatientMoreInfoStatusProjection",
    "PatientMoreInfoResponseThreadProjection",
    "PatientCallbackStatusProjection",
    "PatientReachabilitySummaryProjection",
    "PatientContactRepairProjection",
    "PatientConsentCheckpointProjection",
  ]) {
    assertCondition(embedded.projections.includes(projection), `Missing ${projection}`);
  }
  for (const state of ["reply_needed", "accepted_late_review", "repair_required", "read_only"]) {
    assertCondition(
      expected.matrix.some((row) => row.more_info_state === state),
      `Matrix missing ${state}`,
    );
  }
  for (const caseId of ["stale_secure_link_but_live_cycle", "consent_checkpoint_blocks_reply"]) {
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
    await assertAccessibilityStructure(page);
    await assertScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAndDisclosure(page);
    await assertDataParity(page, expected);

    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    await selectScenario(reducedPage, "callback-window-at-risk");
    await assertNoOverflow(reducedPage);
    await screenshot(reducedPage, "output/playwright/212-reduced-motion.png");
    await reducedContext.close();

    await page.setViewportSize({ width: 390, height: 860 });
    await selectScenario(page, "public-safe-placeholder");
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/212-mobile-public-safe-placeholder.png");
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
  console.log(JSON.stringify({ coverage: responseContinuityAtlasCoverage }, null, 2));
}
