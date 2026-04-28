import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "215_patient_home_requests_and_request_detail_atlas.html",
);
const GRAMMAR_PATH = path.join(ROOT, "docs", "frontend", "215_patient_shell_visual_grammar.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "215_patient_home_requests_and_request_detail_surface_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "215_home_and_request_responsive_layout_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "215_request_placeholder_and_return_bundle_cases.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const patientHomeRequestsDetailCoverage = [
  "Quiet_Casework_Premium",
  "PatientShellFrame",
  "HomeSpotlightCard",
  "QuietHomePanel",
  "RequestIndexRail",
  "RequestSummaryRow",
  "RequestDetailHero",
  "RequestLineageStrip",
  "CasePulsePanel",
  "DecisionDock",
  "GovernedPlaceholderCard",
  "home spotlight and quiet variants",
  "request list buckets and row selection",
  "request detail hero lineage placeholder",
  "keyboard traversal",
  "focus restore route changes",
  "desktop and mobile screenshots",
  "ARIA snapshots",
  "accessibility assertions",
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

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate local port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startPatientWeb() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl };
}

async function stopPatientWeb(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/215_patient_home_requests_and_request_detail_atlas.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    server,
    atlasUrl: `http://127.0.0.1:${port}/docs/frontend/215_patient_home_requests_and_request_detail_atlas.html`,
    grammarUrl: `http://127.0.0.1:${port}/docs/frontend/215_patient_shell_visual_grammar.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

function getExpected() {
  for (const filePath of [ATLAS_PATH, GRAMMAR_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 215 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  assertCondition(
    contract.visualMode === "Quiet_Casework_Premium",
    "Contract visual mode drifted.",
  );
  assertCondition(matrix.length >= 9, "Responsive layout matrix needs broad coverage.");
  assertCondition(cases.cases.length >= 8, "Placeholder and return-bundle cases missing.");
  return { contract, matrix, cases };
}

async function screenshot(page, relativePath) {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function openApp(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
}

async function activeTestId(page) {
  return await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return null;
    }
    return (
      active.getAttribute("data-testid") ??
      active.closest("[data-testid]")?.getAttribute("data-testid") ??
      null
    );
  });
}

async function assertHomeVariants(page, baseUrl) {
  await openApp(page, baseUrl, "/home");
  const root = page.locator("[data-testid='Patient_Home_Requests_Detail_Route']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Quiet_Casework_Premium",
    "Wrong production visual mode.",
  );
  await page.locator("[data-testid='home-spotlight-card']").waitFor();
  await page.locator("[data-testid='home-compact-grid']").waitFor();
  assertCondition(
    (await page.locator("[data-testid^='home-compact-panel-']").count()) === 4,
    "Home must render exactly four compact panels.",
  );
  const bodyText = (
    await page.locator("[data-testid='patient-home-route']").innerText()
  ).toLowerCase();
  for (const forbidden of ["dashboard", "kpi", "chart"]) {
    assertCondition(!bodyText.includes(forbidden), `Home leaked forbidden filler: ${forbidden}`);
  }
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/215-home-desktop.png");

  await openApp(page, baseUrl, "/home?mode=quiet");
  await page.locator("[data-testid='quiet-home-panel']").waitFor();
  const quietText = (
    await page.locator("[data-testid='quiet-home-panel']").innerText()
  ).toLowerCase();
  assertCondition(quietText.includes("no action is needed"), "Quiet variant lost all-clear copy.");
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/215-quiet-home.png");
}

async function assertRequestsAndFocus(page, baseUrl) {
  await openApp(page, baseUrl, "/requests");
  await page.locator("[data-testid='request-index-rail']").waitFor();
  for (const bucket of ["needs_attention", "in_progress", "complete"]) {
    await page.locator(`[data-testid='request-bucket-${bucket}']`).waitFor();
  }
  const firstRow = page.locator("[data-testid='request-summary-row-request_211_a']");
  await firstRow.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await activeTestId(page)) === "request-summary-row-request_211_b",
    "ArrowDown did not move to the next request row.",
  );
  await page.keyboard.press("ArrowUp");
  assertCondition(
    (await activeTestId(page)) === "request-summary-row-request_211_a",
    "ArrowUp did not move to the previous request row.",
  );
  await page.keyboard.press("Enter");
  await page.locator("[data-testid='patient-request-detail-route']").waitFor();
  await page.locator("[data-testid='request-detail-hero']").waitFor();
  await page
    .locator("[data-testid='request-detail-hero']")
    .getByRole("button", { name: "Requests" })
    .click();
  await page.locator("[data-testid='patient-requests-route']").waitFor();
  assertCondition(
    (await activeTestId(page)) === "request-summary-row-request_211_a",
    "Return to requests did not restore selected row focus.",
  );
  await screenshot(page, "output/playwright/215-requests-desktop.png");

  await firstRow.click();
  await page.locator("[data-testid='patient-request-detail-route']").waitFor();
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-requests-route']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='request-summary-row-request_211_a']")
      .getAttribute("data-selected")) === "true",
    "Browser back did not restore selected anchor.",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-requests-route']").waitFor();
  assertCondition(
    (await activeTestId(page)) === "request-summary-row-request_211_a",
    "Refresh replay did not restore selected row focus.",
  );
}

async function assertDetail(page, baseUrl) {
  await openApp(page, baseUrl, "/requests/request_211_a");
  await page.locator("[data-testid='request-lineage-strip']").waitFor();
  await page.locator("[data-testid='request-detail-hero']").waitFor();
  await page.locator("[data-testid='decision-dock']").waitFor();
  await page.locator("[data-testid='case-pulse-panel']").waitFor();
  for (const child of ["more_info", "callback", "records", "communications"]) {
    await page.locator(`[data-testid='governed-placeholder-card-${child}']`).waitFor();
  }
  assertCondition(
    (await page.locator("[data-testid='request-detail-primary-action']").count()) === 1,
    "Detail route must expose one dominant action.",
  );
  await page.locator("[data-testid='request-detail-primary-action']").click();
  assertCondition(
    (await activeTestId(page)) === "governed-placeholder-card-more_info",
    "Primary detail action did not focus the governed more-info placeholder.",
  );
  const detailSnapshot = await page
    .locator("[data-testid='patient-request-detail-route']")
    .ariaSnapshot();
  for (const token of [
    "Dermatology request",
    "Same request context",
    "More information response",
    "PatientNextActionProjection",
  ]) {
    assertCondition(detailSnapshot.includes(token), `Detail ARIA missing ${token}`);
  }
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/215-detail-desktop.png");
}

async function assertResponsiveAndReducedMotion(browser, baseUrl) {
  const tablet = await browser.newPage({ viewport: { width: 900, height: 980 } });
  try {
    await openApp(tablet, baseUrl, "/requests");
    await assertNoOverflow(tablet);
    await screenshot(tablet, "output/playwright/215-requests-tablet.png");
  } finally {
    await tablet.close();
  }

  const mobileHome = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileHome, baseUrl, "/home");
    await assertNoOverflow(mobileHome);
    await screenshot(mobileHome, "output/playwright/215-home-mobile.png");
  } finally {
    await mobileHome.close();
  }

  const mobileRequests = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileRequests, baseUrl, "/requests");
    await assertNoOverflow(mobileRequests);
    await screenshot(mobileRequests, "output/playwright/215-requests-mobile.png");
  } finally {
    await mobileRequests.close();
  }

  const zoomPage = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(zoomPage, baseUrl, "/requests/request_211_a");
    await zoomPage.evaluate(() => {
      document.body.style.zoom = "4";
    });
    await screenshot(zoomPage, "output/playwright/215-detail-zoom.png");
  } finally {
    await zoomPage.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  try {
    await openApp(reducedPage, baseUrl, "/home");
    await reducedPage.locator("[data-testid='home-spotlight-card']").waitFor();
    await screenshot(reducedPage, "output/playwright/215-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }
}

async function assertAtlasAndGrammar(page, staticServer) {
  await page.goto(staticServer.atlasUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Patient_Home_Requests_Detail_Atlas']").waitFor();
  const atlasSnapshot = await page
    .locator("[data-testid='Patient_Home_Requests_Detail_Atlas']")
    .ariaSnapshot();
  for (const token of [
    "Home spotlight",
    "Request detail",
    "PatientRequestsIndexProjection",
    "PatientRequestReturnBundle",
  ]) {
    assertCondition(atlasSnapshot.includes(token), `Atlas ARIA missing ${token}`);
  }
  await page.locator("[data-scenario-button='home-spotlight']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='quiet-home']").getAttribute("aria-selected")) ===
      "true",
    "Atlas ArrowRight did not change selected scenario.",
  );
  for (const scenario of [
    ["home-spotlight", "215-atlas-home.png"],
    ["quiet-home", "215-atlas-quiet.png"],
    ["requests-index", "215-atlas-requests.png"],
    ["request-detail", "215-atlas-detail.png"],
    ["placeholders", "215-atlas-placeholders.png"],
    ["responsive", "215-atlas-responsive.png"],
  ]) {
    await page.locator(`[data-scenario-button='${scenario[0]}']`).click();
    await assertNoOverflow(page);
    await screenshot(page, `output/playwright/${scenario[1]}`);
  }
  await screenshot(page, "output/playwright/215-atlas.png");

  await page.goto(staticServer.grammarUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Patient_Shell_Visual_Grammar']").waitFor();
  await page.locator("[data-testid='TokenBoard']").waitFor();
  await page.locator("[data-testid='PrimitiveBoard']").waitFor();
  await screenshot(page, "output/playwright/215-visual-grammar.png");
}

async function runBrowserChecks(browser) {
  getExpected();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await assertAtlasAndGrammar(page, staticServer);
    await assertHomeVariants(page, patientWeb.baseUrl);
    await assertRequestsAndFocus(page, patientWeb.baseUrl);
    await assertDetail(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main() {
  getExpected();
  if (!process.argv.includes("--run")) {
    console.log("215_patient_home_requests_and_request_detail_routes.spec.js: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runBrowserChecks(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
