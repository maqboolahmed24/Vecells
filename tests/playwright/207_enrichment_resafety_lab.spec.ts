import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LAB_PATH = path.join(ROOT, "docs", "frontend", "207_enrichment_resafety_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "207_suite_results.json");
const CHAINS_PATH = path.join(
  ROOT,
  "data",
  "test",
  "207_expected_enrichment_and_resafety_chains.json",
);
const EXPECTED_SCREENSHOTS = [
  "output/playwright/207-enrichment-resafety-lab.png",
  "output/playwright/207-pds-off.png",
  "output/playwright/207-pds-success.png",
  "output/playwright/207-pds-degraded.png",
  "output/playwright/207-exact-duplicate.png",
  "output/playwright/207-material-resafety.png",
  "output/playwright/207-mobile.png",
  "output/playwright/207-tablet.png",
  "output/playwright/207-reduced-motion.png",
  "output/playwright/207-zoom.png",
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
      pathname = "/docs/frontend/207_enrichment_resafety_lab.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/207_enrichment_resafety_lab.html`,
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
  await page.locator("[data-testid='Enrichment_Resafety_Lab']").waitFor();
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

function expected207(): void {
  for (const filePath of [LAB_PATH, RESULTS_PATH, CHAINS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 207 artifact ${filePath}`);
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
  assertCondition(results.overallStatus === "passed", "207 results are not passing.");
  assertCondition(results.visualMode === "Enrichment_Resafety_Lab", "207 visual mode drifted.");
  assertCondition(
    results.targetedServiceResult.testFilesPassed === 2,
    "Service file count drifted.",
  );
  assertCondition(results.targetedServiceResult.testsPassed === 13, "Service test count drifted.");
  for (const status of ["passed", "failed", "blocked_external", "not_applicable"]) {
    assertCondition(results.statusVocabulary.includes(status), `Missing status ${status}.`);
  }
  const chains = JSON.parse(fs.readFileSync(CHAINS_PATH, "utf8")) as {
    readonly requiredCounters: readonly string[];
  };
  assertCondition(EXPECTED_SCREENSHOTS.length === 10, "Screenshot plan is incomplete.");
  for (const counter of [
    "PDS feature flag off stays local-only",
    "PDS successful enrichment preserves provenance",
    "PDS degraded upstream cannot mutate binding",
    "duplicate exact replay collapses",
    "material late evidence triggers re-safety",
  ]) {
    assertCondition(chains.requiredCounters.includes(counter), `Missing counter ${counter}.`);
  }
}

async function assertStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='Enrichment_Resafety_Lab']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Enrichment_Resafety_Lab",
    "Enrichment resafety visual mode missing.",
  );
  for (const testId of [
    "FeatureGateHeatband",
    "ContactTruthProvenanceStrip",
    "DuplicateClassLadder",
    "ResafetyTriggerChain",
    "EvidenceMatrices",
    "suite-status",
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
    (await page.getByRole("button", { name: "PDS success" }).count()) === 1,
    "PDS success scenario button missing.",
  );
  assertCondition(
    (await page.getByRole("button", { name: "Material re-safety" }).count()) === 1,
    "Material re-safety scenario button missing.",
  );
  assertCondition(
    (await page.getByRole("table", { name: /Evidence matrix excerpt/ }).count()) === 1,
    "Evidence matrix accessible name missing.",
  );
}

async function assertAriaSnapshots(page: Page): Promise<void> {
  await page.getByRole("button", { name: "PDS success" }).click();
  const provenanceSnapshot = await (
    page.locator("[data-testid='ContactTruthProvenanceStrip']") as any
  ).ariaSnapshot();
  for (const token of [
    "data class separation",
    "PDS207_ON_SUCCESS_ENRICHED",
    "contact preference truth",
  ]) {
    assertCondition(
      provenanceSnapshot.includes(token),
      `Provenance strip ARIA snapshot missing ${token}.`,
    );
  }
  const duplicateSnapshot = await (
    page.locator("[data-testid='DuplicateClassLadder']") as any
  ).ariaSnapshot();
  for (const token of ["exact_replay", "same_request_attach", "review_required"]) {
    assertCondition(
      duplicateSnapshot.includes(token),
      `Duplicate ladder ARIA snapshot missing ${token}.`,
    );
  }
}

async function assertKeyboardAndFocus(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: "Material re-safety" });
  await button.focus();
  const outline = await button.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("#active-panel").getAttribute("data-active-case")) === "material-resafety",
    "Keyboard activation did not switch material re-safety case.",
  );
}

async function assertScenarioScreenshots(page: Page): Promise<void> {
  const scenarios = [
    ["PDS off", "pds-off", "207-pds-off.png"],
    ["PDS success", "pds-success", "207-pds-success.png"],
    ["PDS degraded", "pds-degraded", "207-pds-degraded.png"],
    ["Exact duplicate", "exact-duplicate", "207-exact-duplicate.png"],
    ["Material re-safety", "material-resafety", "207-material-resafety.png"],
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

async function assertMatrixTokens(page: Page): Promise<void> {
  const matrixText = await page.locator("[data-testid='EvidenceMatrices']").innerText();
  for (const token of [
    "PDS207_FLAG_OFF_LOCAL_ONLY",
    "PDS207_ON_SUCCESS_ENRICHED",
    "FUP207_EXACT_REPLAY_PHONE",
    "FUP207_LATE_EVIDENCE_RESAFETY",
    "13 tests",
  ]) {
    assertCondition(matrixText.includes(token), `Evidence matrix missing ${token}.`);
  }
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openLab(mobile, url);
    await assertNoOverflow(mobile, 40);
    const pdsTop = await mobile.locator("[aria-labelledby='pds-title']").boundingBox();
    const followupTop = await mobile.locator("[aria-labelledby='followup-title']").boundingBox();
    assertCondition(Boolean(pdsTop && followupTop), "Mobile lane bounds missing.");
    assertCondition(
      (pdsTop?.y ?? 0) < (followupTop?.y ?? 0),
      "Mobile order must keep provenance lane before re-safety lane.",
    );
    await mobile.getByRole("button", { name: "Material re-safety" }).click();
    await screenshot(mobile, "output/playwright/207-mobile.png");
  } finally {
    await mobile.close();
  }

  const tablet = await browser.newPage({ viewport: { width: 900, height: 980 } });
  try {
    await openLab(tablet, url);
    await assertNoOverflow(tablet, 40);
    await screenshot(tablet, "output/playwright/207-tablet.png");
  } finally {
    await tablet.close();
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
    await reducedPage.getByRole("button", { name: "PDS degraded" }).click();
    await screenshot(reducedPage, "output/playwright/207-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function assertZoomResilience(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1040, height: 920 });
  await page.evaluate(() => {
    document.body.style.zoom = "1.25";
    document.body.dataset.zoomProof = "125";
  });
  await page.locator("[data-testid='EvidenceMatrices']").scrollIntoViewIfNeeded();
  assertCondition(
    await page.locator("[data-testid='EvidenceMatrices']").isVisible(),
    "Evidence matrices not visible after zoom proof.",
  );
  await screenshot(page, "output/playwright/207-zoom.png");
}

async function runBrowserSuite(browser: Browser): Promise<void> {
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1040 } });
  try {
    await openLab(page, staticServer.url);
    await assertStructure(page);
    await assertAccessibilityBasics(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAndFocus(page);
    await assertMatrixTokens(page);
    await assertScenarioScreenshots(page);
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/207-enrichment-resafety-lab.png");
    await assertZoomResilience(page);
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected207();
  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log(
      "207 enrichment resafety lab structural checks passed; use --run for browser proof",
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
  console.log("207 enrichment resafety lab Playwright checks passed");
}

await main();
