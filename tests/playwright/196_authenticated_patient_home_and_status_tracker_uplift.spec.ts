import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "196_authenticated_home_and_status_tracker_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "196_authenticated_home_surface_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "196_home_spotlight_and_request_tracker_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "196_request_detail_visibility_and_anchor_cases.json",
);

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
}

interface PatientWebServer {
  readonly child: ChildProcess;
  readonly baseUrl: string;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

async function allocatePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function startStaticServer(): Promise<StaticServer> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/196_authenticated_home_and_status_tracker_atlas.html";
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

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/196_authenticated_home_and_status_tracker_atlas.html`,
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url: string, timeoutMs = 15_000): Promise<void> {
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

async function startPatientWeb(): Promise<PatientWebServer> {
  const port = await allocatePort();
  const logs: string[] = [];
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

async function stopPatientWeb(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

function expected196() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_196 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly projections: readonly string[];
  };
  assertCondition(contract.visualMode === "Quiet_Portal_Atlas", "Wrong visual mode.");
  assertCondition(
    contract.projections.includes("PatientRequestReturnBundle"),
    "Contract lost return bundle.",
  );
  return contract;
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Authenticated_Home_Status_Tracker_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Authenticated_Patient_Home_Status_Tracker_Route']").waitFor();
}

async function assertNoOverflow(page: Page, maxOverflow = 12): Promise<void> {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - window.innerWidth,
    bodyWidth: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.width <= maxOverflow && overflow.bodyWidth <= maxOverflow,
    `Overflow exceeded tolerance: ${JSON.stringify(overflow)}`,
  );
}

async function activeTestId(page: Page): Promise<string | null> {
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

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertAtlas(page: Page): Promise<void> {
  for (const testId of [
    "spotlight-state-gallery",
    "request-row-parity-matrix",
    "quiet-attention-decision-board",
    "continuity-diagram",
    "atlas-parity-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  await page.locator("[data-testid='spotlight-state-select']").selectOption("blocker");
  const card = await page.locator("[data-testid='spotlight-state-card']").innerText();
  assertCondition(
    card.includes("contact_route_blocks_current_action"),
    "Atlas blocker state failed.",
  );
}

async function assertHomeAndQuiet(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/home");
  const root = page.locator("[data-testid='Authenticated_Patient_Home_Status_Tracker_Route']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Quiet_Portal_Atlas",
    "Wrong visual mode.",
  );
  await page.getByRole("navigation", { name: "Patient portal" }).waitFor();
  assertCondition(
    (await page.locator("[data-testid='portal-nav-home']").getAttribute("aria-current")) === "page",
    "Home nav did not expose aria-current.",
  );
  await page.locator("[data-testid='request-spotlight-panel']").waitFor();
  await page.locator("[data-testid='compact-request-card-active_requests']").waitFor();
  await page.locator("[data-testid='compact-request-card-callback_attention']").waitFor();
  await page.locator("[data-testid='compact-request-card-account_details']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='single-dominant-action-proof']").innerText()).includes(
      "PatientSpotlightDecisionProjection",
    ),
    "Home lost single dominant action proof.",
  );
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/196-home-desktop.png");

  await openApp(page, baseUrl, "/portal/quiet");
  await page.locator("[data-testid='quiet-home-panel']").waitFor();
  const quietText = (
    await page.locator("[data-testid='quiet-home-panel']").innerText()
  ).toLowerCase();
  assertCondition(quietText.includes("no action is needed"), "Quiet home lost calm copy.");
  assertCondition(!quietText.includes("dashboard"), "Quiet home leaked dashboard filler.");
  await assertNoOverflow(page);
}

async function assertRequestsAndAnchor(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/requests");
  for (const group of ["needs_attention", "in_progress", "complete"]) {
    await page.locator(`[data-testid='request-group-${group}']`).waitFor();
  }
  const row = page.locator("[data-testid='request-tracker-row-REQ-4219']");
  await row.focus();
  assertCondition(
    (await activeTestId(page)) === "request-tracker-row-REQ-4219",
    "Row focus failed.",
  );
  await page.keyboard.press("Enter");
  await page.locator("[data-testid='authenticated-request-detail']").waitFor();
  await page.getByRole("heading", { name: "Dermatology photo timing" }).waitFor();
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator("[data-testid='authenticated-requests-index']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='request-tracker-row-REQ-4219']")
      .getAttribute("data-selected")) === "true",
    "Browser back did not preserve selected request anchor.",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='authenticated-requests-index']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='request-tracker-row-REQ-4219']")
      .getAttribute("data-selected")) === "true",
    "Refresh replay did not preserve selected request anchor.",
  );
  assertCondition(
    (await page.locator("[data-testid='portal-live-region']").innerText()).includes("REQ-4219"),
    "Return bundle live region lost selected request.",
  );
}

async function assertSessionReachabilityAndNarrowing(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/session-expiring");
  await page.locator("[data-testid='session-expiry-banner']").waitFor();
  await page.getByRole("button", { name: "Use bounded recovery" }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='Authenticated_Patient_Home_Status_Tracker_Route']")
        ?.getAttribute("data-route-key") === "session_expired",
  );
  await page.locator("[data-testid='session-expiry-banner']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='Authenticated_Patient_Home_Status_Tracker_Route']")
      .getAttribute("data-route-key")) === "session_expired",
    "Session recovery did not enter expired route.",
  );

  await openApp(page, baseUrl, "/portal/reachability-blocker");
  await page.locator("[data-testid='reachability-blocker-promoted']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='request-spotlight-panel']").getAttribute("data-reason")) ===
      "contact_route_blocks_current_action",
    "Reachability blocker was not promoted from identity hold.",
  );

  await openApp(page, baseUrl, "/portal/requests/REQ-4219/narrowed");
  const detail = page.locator("[data-testid='authenticated-request-detail']");
  await detail.waitFor();
  assertCondition(
    (await detail.getAttribute("data-coverage")) === "summary_only",
    "Detail did not narrow.",
  );
  assertCondition(
    (await page.locator("[data-testid='audience-coverage-badge']").first().innerText()).includes(
      "identity hold narrowed",
    ) || (await detail.innerText()).includes("summary is visible"),
    "Narrowed detail did not explain audience hold.",
  );
}

async function assertResponsiveAndReducedMotion(browser: Browser, baseUrl: string): Promise<void> {
  const sizes = [
    { name: "tablet", width: 900, height: 980 },
    { name: "mobile", width: 390, height: 880 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openApp(page, baseUrl, "/portal/home");
      await assertNoOverflow(page);
      await screenshot(page, `output/playwright/196-home-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  try {
    await openApp(reducedPage, baseUrl, "/portal/home");
    await reducedPage.keyboard.press("Tab");
    await reducedPage.locator("[data-testid='request-spotlight-panel']").waitFor();
    await screenshot(reducedPage, "output/playwright/196-home-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected196();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/196-atlas.png");
    await assertHomeAndQuiet(page, patientWeb.baseUrl);
    await assertRequestsAndAnchor(page, patientWeb.baseUrl);
    await assertSessionReachabilityAndNarrowing(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected196();
  if (!process.argv.includes("--run")) {
    console.log("196_authenticated_patient_home_and_status_tracker_uplift.spec.ts: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
  assertCondition(playwright, "Playwright unavailable.");
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
