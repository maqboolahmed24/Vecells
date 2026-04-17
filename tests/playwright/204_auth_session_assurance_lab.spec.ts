import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LAB_PATH = path.join(ROOT, "docs", "frontend", "204_auth_session_assurance_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "204_suite_results.json");
const EVENTS_PATH = path.join(ROOT, "data", "test", "204_expected_events_and_settlements.json");
const EXPECTED_SCREENSHOTS = [
  "output/playwright/204-auth-session-assurance-lab.png",
  "output/playwright/204-auth-session-wide.png",
  "output/playwright/204-auth-session-standard.png",
  "output/playwright/204-auth-session-tablet.png",
  "output/playwright/204-auth-session-mobile.png",
  "output/playwright/204-auth-session-reduced-motion.png",
  "output/playwright/204-auth-session-zoom.png",
] as const;

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
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
      pathname = "/docs/frontend/204_auth_session_assurance_lab.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/204_auth_session_assurance_lab.html`,
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openLab(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Auth_Session_Assurance_Lab']").waitFor();
}

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoBodyOverflow(page: Page, maxOverflow = 24): Promise<void> {
  const overflow = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.html <= maxOverflow && overflow.body <= maxOverflow,
    `Unexpected body overflow: ${JSON.stringify(overflow)}`,
  );
}

function expected204(): void {
  for (const filePath of [LAB_PATH, RESULTS_PATH, EVENTS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 204 artifact ${filePath}`);
  }
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8")) as {
    readonly overallStatus: string;
    readonly visualMode: string;
    readonly statusVocabulary: readonly string[];
  };
  assertCondition(results.overallStatus === "passed", "204 results are not passing.");
  assertCondition(results.visualMode === "Auth_Session_Assurance_Lab", "204 visual mode drifted.");
  for (const status of ["passed", "failed", "blocked_external", "not_applicable"]) {
    assertCondition(results.statusVocabulary.includes(status), `Missing status ${status}.`);
  }

  const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8")) as {
    readonly requiredCounters: readonly string[];
  };
  assertCondition(EXPECTED_SCREENSHOTS.length === 7, "Screenshot plan is incomplete.");
  for (const counter of [
    "callback accepted",
    "callback replay blocked",
    "callback mapped to settled transaction",
    "session rotated",
    "session expired idle",
    "session expired absolute",
    "logout completed",
    "stale-tab write denied",
    "wrong-patient hold entered",
    "wrong-patient hold released",
    "PHI suppressed due to hold or mismatch",
  ]) {
    assertCondition(events.requiredCounters.includes(counter), `Missing counter ${counter}.`);
  }
}

async function assertStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='Auth_Session_Assurance_Lab']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Auth_Session_Assurance_Lab",
    "Auth lab visual mode missing.",
  );
  for (const testId of [
    "scenario-rail",
    "transaction-canvas",
    "inspector-rail",
    "scenario-chip-strip",
    "AuthTransactionBraid",
    "SessionEpochLadder",
    "SubjectFenceMap",
    "SameShellRecoveryFrame",
    "EvidenceTable",
    "evidence-grid",
    "suite-status",
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing ${testId}.`,
    );
  }
}

async function assertScenarioStates(page: Page): Promise<void> {
  const expectations = [
    ["Live", "state: live", "callback accepted"],
    ["Recovery", "state: recovery", "callback replay blocked"],
    ["Read-only", "state: read-only", "wrong-patient hold entered"],
    ["Blocked", "state: blocked", "logout completed"],
  ] as const;

  for (const [name, state, inspectorToken] of expectations) {
    await page.getByRole("tab", { name }).click();
    await page.waitForTimeout(190);
    assertCondition(
      (await page.locator("[data-testid='scenario-posture']").innerText()).includes(state),
      `${name} did not update scenario posture.`,
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-state']").innerText()).includes(inspectorToken),
      `${name} did not update inspector token ${inspectorToken}.`,
    );
  }
}

async function assertKeyboardAndFocus(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Live" }).focus();
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() || "");
  assertCondition(focused.includes("Recovery"), "ArrowRight did not move focus to Recovery.");
  const outline = await page.getByRole("tab", { name: "Recovery" }).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);

  await page.keyboard.press("End");
  const endFocused = await page.evaluate(() => document.activeElement?.textContent?.trim() || "");
  assertCondition(endFocused.includes("Blocked"), "End key did not move to Blocked.");
}

async function assertAriaSnapshots(page: Page): Promise<void> {
  const rootSnapshot = await (
    page.locator("[data-testid='Auth_Session_Assurance_Lab']") as any
  ).ariaSnapshot();
  for (const token of ["Auth session assurance lab", "Live", "Recovery", "Evidence table"]) {
    assertCondition(rootSnapshot.includes(token), `ARIA snapshot missing ${token}.`);
  }

  const tableSnapshot = await (page.locator("[data-testid='EvidenceTable']") as any).ariaSnapshot();
  for (const token of ["AUTH204_VALID_CALLBACK_EXACT_ONCE", "blocked_external", "not_applicable"]) {
    assertCondition(tableSnapshot.includes(token), `Evidence ARIA snapshot missing ${token}.`);
  }
}

async function assertDiagramTableParity(page: Page): Promise<void> {
  const diagramTokens = await page
    .locator("[data-testid='AuthTransactionBraid']")
    .getAttribute("data-parity");
  const tableText = await page.locator("[data-testid='EvidenceTable']").innerText();
  for (const token of [
    "AUTH204_VALID_CALLBACK_EXACT_ONCE",
    "AUTH204_IDLE_TIMEOUT",
    "AUTH204_WRONG_SUBJECT_SECURE_LINK",
    "AUTH204_LOGOUT_BROWSER_BACK",
  ]) {
    assertCondition(
      tableText.includes(token) || diagramTokens?.includes(token),
      `Diagram/table parity missing ${token}.`,
    );
  }
}

async function assertAccessibilityBasics(page: Page): Promise<void> {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  assertCondition(
    (await page.locator("h1").innerText()).includes("Auth session assurance lab"),
    "Missing h1.",
  );
  assertCondition((await page.getByRole("tab").count()) === 4, "Expected four scenario tabs.");
  const tableName = await page.getByRole("table", { name: /Evidence table/ }).count();
  assertCondition(tableName === 1, "Evidence table accessible name missing.");
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const sizes = [
    { name: "wide", width: 1600, height: 1000 },
    { name: "standard", width: 1280, height: 900 },
    { name: "tablet", width: 820, height: 1000 },
    { name: "mobile", width: 390, height: 860 },
  ];

  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openLab(page, url);
      await assertNoBodyOverflow(page, size.name === "mobile" ? 36 : 24);
      await screenshot(page, `output/playwright/204-auth-session-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 860 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openLab(reducedPage, url);
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "Reduced motion media query did not match.");
    await reducedPage.getByRole("tab", { name: "Blocked" }).click();
    await screenshot(reducedPage, "output/playwright/204-auth-session-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function assertZoomResilience(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.evaluate(() => {
    document.body.style.zoom = "1.1";
    document.body.dataset.zoomProof = "125";
  });
  await page.locator("[data-testid='EvidenceTable']").scrollIntoViewIfNeeded();
  assertCondition(
    await page.locator("[data-testid='EvidenceTable']").isVisible(),
    "Evidence table not visible after zoom proof.",
  );
  await screenshot(page, "output/playwright/204-auth-session-zoom.png");
}

async function runBrowserSuite(browser: Browser): Promise<void> {
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await openLab(page, staticServer.url);
    await assertStructure(page);
    await assertAccessibilityBasics(page);
    await assertAriaSnapshots(page);
    await assertScenarioStates(page);
    await assertKeyboardAndFocus(page);
    await assertDiagramTableParity(page);
    await assertNoBodyOverflow(page);
    await screenshot(page, "output/playwright/204-auth-session-assurance-lab.png");
    await assertZoomResilience(page);
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected204();
  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log(
      "204 auth session assurance lab structural checks passed; use --run for browser proof",
    );
    return;
  }
  assertCondition(playwright, "Playwright import failed.");
  const browser = await playwright.chromium.launch();
  try {
    await runBrowserSuite(browser);
  } finally {
    await browser.close();
  }
  console.log("204 auth session assurance lab Playwright checks passed");
}

await main();
