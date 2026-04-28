import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LAB_PATH = path.join(ROOT, "docs", "frontend", "206_parity_repair_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "206_suite_results.json");
const CHAINS_PATH = path.join(
  ROOT,
  "data",
  "test",
  "206_expected_identity_hold_and_release_chains.json",
);
const EXPECTED_SCREENSHOTS = [
  "output/playwright/206-parity-repair-lab.png",
  "output/playwright/206-parity-aligned.png",
  "output/playwright/206-parity-duplicate.png",
  "output/playwright/206-parity-resafety.png",
  "output/playwright/206-parity-active-hold.png",
  "output/playwright/206-parity-released.png",
  "output/playwright/206-parity-mobile-web.png",
  "output/playwright/206-parity-mobile-phone.png",
  "output/playwright/206-parity-reduced-motion.png",
  "output/playwright/206-parity-zoom.png",
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
      pathname = "/docs/frontend/206_parity_repair_lab.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/206_parity_repair_lab.html`,
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
  await page.locator("[data-testid='Parity_Repair_Lab']").waitFor();
}

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page: Page, maxOverflow = 32): Promise<void> {
  const overflow = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.html <= maxOverflow && overflow.body <= maxOverflow,
    `Unexpected overflow: ${JSON.stringify(overflow)}`,
  );
}

function expected206(): void {
  for (const filePath of [LAB_PATH, RESULTS_PATH, CHAINS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 206 artifact ${filePath}`);
  }
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8")) as {
    readonly overallStatus: string;
    readonly visualMode: string;
    readonly statusVocabulary: readonly string[];
    readonly targetedServiceResult: {
      readonly testFilesPassed: number;
      readonly testsPassed: number;
    };
  };
  assertCondition(results.overallStatus === "passed", "206 results are not passing.");
  assertCondition(results.visualMode === "Parity_Repair_Lab", "206 visual mode drifted.");
  assertCondition(
    results.targetedServiceResult.testFilesPassed === 4,
    "Service file count drifted.",
  );
  assertCondition(results.targetedServiceResult.testsPassed === 22, "Service test count drifted.");
  for (const status of ["passed", "failed", "blocked_external", "not_applicable"]) {
    assertCondition(results.statusVocabulary.includes(status), `Missing status ${status}.`);
  }
  const chains = JSON.parse(fs.readFileSync(CHAINS_PATH, "utf8")) as {
    readonly requiredCounters: readonly string[];
  };
  assertCondition(EXPECTED_SCREENSHOTS.length === 10, "Screenshot plan is incomplete.");
  for (const counter of [
    "wrong-patient hold entered",
    "PHI suppressed immediately",
    "branch compensation pending blocks release",
    "web phone canonical tuple aligned",
    "duplicate exact collapsed",
    "material new evidence triggers re-safety",
    "same-shell recovery preserved",
  ]) {
    assertCondition(chains.requiredCounters.includes(counter), `Missing counter ${counter}.`);
  }
}

async function assertStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='Parity_Repair_Lab']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Parity_Repair_Lab",
    "Parity repair visual mode missing.",
  );
  for (const testId of [
    "suite-status",
    "mobile-comparison-switcher",
    "web-origin-lane",
    "phone-origin-lane",
    "ParityBraid",
    "WrongPatientFreezeReleaseChain",
    "StatusSemanticsMirror",
    "SuppressionInspector",
    "MatrixPair",
    "parity-matrix",
    "freeze-matrix",
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing ${testId}.`,
    );
  }
}

async function assertAccessibilityBasics(page: Page): Promise<void> {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  assertCondition(
    (await page.getByRole("button", { name: "Duplicate parity" }).count()) === 1,
    "Scenario button missing.",
  );
  assertCondition(
    (await page.getByRole("table", { name: /Parity matrix/ }).count()) === 1,
    "Parity matrix accessible name missing.",
  );
  assertCondition(
    (await page.getByRole("table", { name: /Freeze release matrix/ }).count()) === 1,
    "Freeze matrix accessible name missing.",
  );
}

async function assertAriaSnapshots(page: Page): Promise<void> {
  const webSnapshot = await (page.locator("[data-testid='web-origin-lane']") as any).ariaSnapshot();
  for (const token of ["Structured form evidence", "Symptoms", "pending_review"]) {
    assertCondition(webSnapshot.includes(token), `Web lane ARIA snapshot missing ${token}.`);
  }
  const phoneSnapshot = await (
    page.locator("[data-testid='phone-origin-lane']") as any
  ).ariaSnapshot();
  for (const token of ["Call and continuation evidence", "same_request_attach", "provenance"]) {
    assertCondition(phoneSnapshot.includes(token), `Phone lane ARIA snapshot missing ${token}.`);
  }
  const braidSnapshot = await (page.locator("[data-testid='ParityBraid']") as any).ariaSnapshot();
  for (const token of ["Capture", "Normalize", "Decide", "Return"]) {
    assertCondition(braidSnapshot.includes(token), `Braid ARIA snapshot missing ${token}.`);
  }
  const matrixSnapshot = await (page.locator("[data-testid='MatrixPair']") as any).ariaSnapshot();
  for (const token of [
    "PAR206_EXACT_DUPLICATE",
    "PAR206_MATERIAL_NEW_EVIDENCE",
    "WPR206_RELEASE_SETTLEMENT_BINDING_STALE",
    "blocked_external",
    "not_applicable",
  ]) {
    assertCondition(matrixSnapshot.includes(token), `Matrix ARIA snapshot missing ${token}.`);
  }
}

async function assertKeyboardAndFocus(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: "Duplicate parity" });
  await button.focus();
  const outline = await button.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("#active-panel").getAttribute("data-active-case")) === "duplicate",
    "Keyboard activation did not switch duplicate parity case.",
  );
}

async function assertScenarioScreenshots(page: Page): Promise<void> {
  const scenarios = [
    ["Aligned parity", "aligned", "206-parity-aligned.png"],
    ["Duplicate parity", "duplicate", "206-parity-duplicate.png"],
    ["Material re-safety", "resafety", "206-parity-resafety.png"],
    ["Active wrong-patient hold", "active-hold", "206-parity-active-hold.png"],
    ["Released and resumed", "released", "206-parity-released.png"],
  ] as const;
  for (const [name, caseName, fileName] of scenarios) {
    await page.getByRole("button", { name }).click();
    await page.waitForTimeout(180);
    assertCondition(
      (await page.locator("#active-panel").getAttribute("data-active-case")) === caseName,
      `${name} did not become active.`,
    );
    await screenshot(page, `output/playwright/${fileName}`);
  }
}

async function assertDiagramTableParity(page: Page): Promise<void> {
  const parityText = [
    await page.locator("[data-testid='ParityBraid']").getAttribute("data-parity"),
    await page.locator("[data-testid='parity-matrix']").innerText(),
    await page.locator("[data-testid='freeze-matrix']").innerText(),
  ].join(" ");
  for (const token of [
    "PAR206_SAME_SYMPTOMS",
    "PAR206_EXACT_DUPLICATE",
    "PAR206_SEMANTIC_DUPLICATE",
    "PAR206_MATERIAL_NEW_EVIDENCE",
    "WPR206_RELEASE_SETTLEMENT_BINDING_STALE",
  ]) {
    assertCondition(parityText.includes(token), `Diagram/table parity missing ${token}.`);
  }
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openLab(mobile, url);
    await assertNoOverflow(mobile, 40);
    await screenshot(mobile, "output/playwright/206-parity-mobile-web.png");
    await mobile.getByRole("button", { name: "Phone lane" }).click();
    assertCondition(
      (await mobile
        .locator("[data-testid='Parity_Repair_Lab']")
        .getAttribute("data-mobile-lane")) === "phone",
      "Mobile lane switch did not select phone.",
    );
    await screenshot(mobile, "output/playwright/206-parity-mobile-phone.png");
  } finally {
    await mobile.close();
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 880 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openLab(reducedPage, url);
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "Reduced motion media query did not match.");
    await reducedPage.getByRole("button", { name: "Active wrong-patient hold" }).click();
    await screenshot(reducedPage, "output/playwright/206-parity-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function assertZoomResilience(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1040, height: 920 });
  await page.evaluate(() => {
    document.body.style.zoom = "1.12";
    document.body.dataset.zoomProof = "125";
  });
  await page.locator("[data-testid='MatrixPair']").scrollIntoViewIfNeeded();
  assertCondition(
    await page.locator("[data-testid='MatrixPair']").isVisible(),
    "Matrix pair not visible after zoom proof.",
  );
  await screenshot(page, "output/playwright/206-parity-zoom.png");
}

async function runBrowserSuite(browser: Browser): Promise<void> {
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1020 } });
  try {
    await openLab(page, staticServer.url);
    await assertStructure(page);
    await assertAccessibilityBasics(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAndFocus(page);
    await assertDiagramTableParity(page);
    await assertScenarioScreenshots(page);
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/206-parity-repair-lab.png");
    await assertZoomResilience(page);
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected206();
  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log("206 parity repair lab structural checks passed; use --run for browser proof");
    return;
  }
  assertCondition(playwright, "Playwright import failed.");
  const browser = await playwright.chromium.launch();
  try {
    await runBrowserSuite(browser);
  } finally {
    await browser.close();
  }
  console.log("206 parity repair lab Playwright checks passed");
}

await main();
