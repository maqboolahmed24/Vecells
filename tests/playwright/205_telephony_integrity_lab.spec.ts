import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LAB_PATH = path.join(ROOT, "docs", "frontend", "205_telephony_integrity_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "205_suite_results.json");
const EVENTS_PATH = path.join(ROOT, "data", "test", "205_expected_readiness_and_settlements.json");
const EXPECTED_SCREENSHOTS = [
  "output/playwright/205-telephony-integrity-lab.png",
  "output/playwright/205-telephony-tab-webhook.png",
  "output/playwright/205-telephony-tab-ivr.png",
  "output/playwright/205-telephony-tab-recording.png",
  "output/playwright/205-telephony-tab-readiness.png",
  "output/playwright/205-telephony-tab-grant.png",
  "output/playwright/205-telephony-bad-signature.png",
  "output/playwright/205-telephony-bad-audio.png",
  "output/playwright/205-telephony-superseded-grant.png",
  "output/playwright/205-telephony-mobile.png",
  "output/playwright/205-telephony-reduced-motion.png",
  "output/playwright/205-telephony-zoom.png",
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
      pathname = "/docs/frontend/205_telephony_integrity_lab.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/205_telephony_integrity_lab.html`,
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
  await page.locator("[data-testid='Telephony_Integrity_Grant_Lab']").waitFor();
}

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page: Page, maxOverflow = 30): Promise<void> {
  const overflow = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.html <= maxOverflow && overflow.body <= maxOverflow,
    `Unexpected overflow: ${JSON.stringify(overflow)}`,
  );
}

function expected205(): void {
  for (const filePath of [LAB_PATH, RESULTS_PATH, EVENTS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 205 artifact ${filePath}`);
  }
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8")) as {
    readonly overallStatus: string;
    readonly visualMode: string;
    readonly statusVocabulary: readonly string[];
  };
  assertCondition(results.overallStatus === "passed", "205 results are not passing.");
  assertCondition(
    results.visualMode === "Telephony_Integrity_Grant_Lab",
    "205 visual mode drifted.",
  );
  for (const status of ["passed", "failed", "blocked_external", "not_applicable"]) {
    assertCondition(results.statusVocabulary.includes(status), `Missing status ${status}.`);
  }
  const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8")) as {
    readonly requiredCounters: readonly string[];
  };
  assertCondition(EXPECTED_SCREENSHOTS.length === 12, "Screenshot plan is incomplete.");
  for (const counter of [
    "webhook accepted",
    "webhook rejected invalid signature",
    "webhook replay blocked",
    "call session advanced",
    "recording quarantined",
    "recording unusable",
    "readiness sufficient",
    "readiness insufficient",
    "continuation grant issued seeded",
    "continuation grant issued challenge",
    "continuation grant redeemed",
    "continuation grant replay blocked",
    "continuation grant superseded",
  ]) {
    assertCondition(events.requiredCounters.includes(counter), `Missing counter ${counter}.`);
  }
}

async function assertStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='Telephony_Integrity_Grant_Lab']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Telephony_Integrity_Grant_Lab",
    "Telephony visual mode missing.",
  );
  for (const testId of [
    "scenario-rail",
    "central-evidence-plane",
    "detail-rail",
    "tab-strip",
    "VoiceIngressLadder",
    "AudioCustodyChain",
    "SeededVsChallengeGrantStrip",
    "TelephonyParityNote",
    "EvidenceMatrix",
    "lower-matrix-zone",
    "suite-status",
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing ${testId}.`,
    );
  }
}

async function assertTabScreenshots(page: Page): Promise<void> {
  const tabs = [
    ["Webhook", "205-telephony-tab-webhook.png"],
    ["IVR", "205-telephony-tab-ivr.png"],
    ["Recording", "205-telephony-tab-recording.png"],
    ["Readiness", "205-telephony-tab-readiness.png"],
    ["Grant", "205-telephony-tab-grant.png"],
  ] as const;
  for (const [tab, fileName] of tabs) {
    await page.getByRole("tab", { name: tab }).click();
    await page.waitForTimeout(190);
    assertCondition(
      (await page.locator("#active-panel").getAttribute("data-active-tab")) === tab,
      `${tab} did not become active.`,
    );
    await screenshot(page, `output/playwright/${fileName}`);
  }
}

async function assertScenarioScreenshots(page: Page): Promise<void> {
  const scenarios = [
    ["Bad signature", "bad-signature", "205-telephony-bad-signature.png"],
    ["Bad audio", "bad-audio", "205-telephony-bad-audio.png"],
    ["Superseded grant", "superseded-grant", "205-telephony-superseded-grant.png"],
  ] as const;
  for (const [name, caseName, fileName] of scenarios) {
    await page.getByRole("button", { name }).click();
    await page.waitForTimeout(190);
    assertCondition(
      (await page.locator("#active-panel").getAttribute("data-active-case")) === caseName,
      `${name} did not become active.`,
    );
    await screenshot(page, `output/playwright/${fileName}`);
  }
}

async function assertKeyboardAndFocus(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Webhook" }).focus();
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() || "");
  assertCondition(focused.includes("IVR"), "ArrowRight did not move focus to IVR.");
  const outline = await page.getByRole("tab", { name: "IVR" }).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);
  await page.keyboard.press("End");
  const endFocused = await page.evaluate(() => document.activeElement?.textContent?.trim() || "");
  assertCondition(endFocused.includes("Grant"), "End key did not move focus to Grant.");
}

async function assertAriaSnapshots(page: Page): Promise<void> {
  const tabSnapshot = await (page.locator("[data-testid='tab-strip']") as any).ariaSnapshot();
  for (const token of ["Webhook", "IVR", "Recording", "Readiness", "Grant"]) {
    assertCondition(tabSnapshot.includes(token), `Tab ARIA snapshot missing ${token}.`);
  }
  const railSnapshot = await (page.locator("[data-testid='scenario-rail']") as any).ariaSnapshot();
  for (const token of ["Bad signature", "Bad audio", "Superseded grant"]) {
    assertCondition(railSnapshot.includes(token), `Scenario rail ARIA snapshot missing ${token}.`);
  }
  const matrixSnapshot = await (
    page.locator("[data-testid='EvidenceMatrix']") as any
  ).ariaSnapshot();
  for (const token of [
    "TEL205_INVALID_SIGNATURE",
    "TEL205_CORRUPT_AUDIO",
    "TEL205_SUPERSEDED_GRANT_AFTER_NEWER_ISSUANCE",
    "blocked_external",
    "not_applicable",
  ]) {
    assertCondition(matrixSnapshot.includes(token), `Evidence ARIA snapshot missing ${token}.`);
  }
}

async function assertAccessibilityBasics(page: Page): Promise<void> {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  assertCondition((await page.getByRole("tab").count()) === 5, "Expected five tabs.");
  assertCondition(
    (await page.getByRole("table", { name: /Evidence matrix/ }).count()) === 1,
    "Evidence matrix accessible name missing.",
  );
}

async function assertDiagramTableParity(page: Page): Promise<void> {
  const parityText = [
    await page.locator("[data-testid='VoiceIngressLadder']").getAttribute("data-parity"),
    await page.locator("[data-testid='AudioCustodyChain']").getAttribute("data-parity"),
    await page.locator("[data-testid='SeededVsChallengeGrantStrip']").getAttribute("data-parity"),
    await page.locator("[data-testid='EvidenceMatrix']").innerText(),
  ].join(" ");
  for (const token of [
    "TEL205_INVALID_SIGNATURE",
    "TEL205_DTMF_CAPTURE",
    "TEL205_CORRUPT_AUDIO",
    "TEL205_SUPERSEDED_GRANT_AFTER_NEWER_ISSUANCE",
  ]) {
    assertCondition(parityText.includes(token), `Diagram/table parity missing ${token}.`);
  }
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 } });
  try {
    await openLab(mobile, url);
    await assertNoOverflow(mobile, 40);
    await screenshot(mobile, "output/playwright/205-telephony-mobile.png");
  } finally {
    await mobile.close();
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
    await reducedPage.getByRole("button", { name: "Bad signature" }).click();
    await screenshot(reducedPage, "output/playwright/205-telephony-reduced-motion.png");
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
  await page.locator("[data-testid='EvidenceMatrix']").scrollIntoViewIfNeeded();
  assertCondition(
    await page.locator("[data-testid='EvidenceMatrix']").isVisible(),
    "Evidence matrix not visible after zoom proof.",
  );
  await screenshot(page, "output/playwright/205-telephony-zoom.png");
}

async function runBrowserSuite(browser: Browser): Promise<void> {
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  try {
    await openLab(page, staticServer.url);
    await assertStructure(page);
    await assertAccessibilityBasics(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAndFocus(page);
    await assertDiagramTableParity(page);
    await assertTabScreenshots(page);
    await assertScenarioScreenshots(page);
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/205-telephony-integrity-lab.png");
    await assertZoomResilience(page);
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected205();
  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log(
      "205 telephony integrity lab structural checks passed; use --run for browser proof",
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
  console.log("205 telephony integrity lab Playwright checks passed");
}

await main();
