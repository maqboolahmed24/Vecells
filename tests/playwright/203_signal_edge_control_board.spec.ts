import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const BOARD_PATH = path.join(ROOT, "docs", "frontend", "203_signal_edge_control_board.html");
const MANIFEST_PATH = path.join(ROOT, "data", "contracts", "203_signal_provider_manifest.json");
const SELECTORS_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "203_signal_provider_selector_manifests.json",
);
const LIVE_GATE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "203_live_gate_and_rollback_checklist.json",
);

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
      pathname = "/docs/frontend/203_signal_edge_control_board.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/203_signal_edge_control_board.html`,
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openBoard(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Signal_Edge_Control_Board']").waitFor();
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

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

function expected203(): void {
  for (const filePath of [BOARD_PATH, MANIFEST_PATH, SELECTORS_PATH, LIVE_GATE_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 203 artifact ${filePath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly liveMutationGate: {
      readonly liveMutationAllowedByDefault: boolean;
      readonly requiredPreconditions: readonly string[];
    };
    readonly environmentSet: readonly { readonly environmentId: string }[];
    readonly providerFamilies: readonly {
      readonly family: string;
      readonly signatureVerification: { readonly required: boolean };
      readonly replayProtection: { readonly required: boolean };
    }[];
  };
  assertCondition(manifest.visualMode === "Signal_Edge_Control_Board", "Wrong visual mode.");
  const environments = new Set(manifest.environmentSet.map((env) => env.environmentId));
  for (const required of ["local", "sandbox_twin", "provider_candidate", "live_candidate"]) {
    assertCondition(environments.has(required), `Missing environment ${required}.`);
  }
  assertCondition(
    manifest.liveMutationGate.liveMutationAllowedByDefault === false,
    "Live mutation default is not blocked.",
  );
  assertCondition(
    manifest.liveMutationGate.requiredPreconditions.includes("rollback_snapshot_captured"),
    "Rollback snapshot is not required.",
  );
  for (const family of manifest.providerFamilies) {
    assertCondition(family.signatureVerification.required, `${family.family} signature missing.`);
    assertCondition(family.replayProtection.required, `${family.family} replay missing.`);
  }
}

async function assertBoardStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='Signal_Edge_Control_Board']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Signal_Edge_Control_Board",
    "Control board visual mode drifted.",
  );
  for (const testId of [
    "family-tab-rail",
    "endpoint-coverage-board",
    "evidence-drawer",
    "endpoint-provider-family-matrix",
    "endpoint-provider-family-table",
    "event-subscription-coverage-diagram",
    "event-subscription-coverage-table",
    "signature-replay-guard-board",
    "signature-replay-guard-table",
    "live-gate-checklist",
    "redacted-screenshot-list",
    "lower-endpoint-parity-strip",
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing control board anchor ${testId}.`,
    );
  }
}

async function assertTabsAndKeyboard(page: Page): Promise<void> {
  const tabs = ["Telephony", "SMS", "Email", "Replay", "Evidence"];
  for (const tab of tabs) {
    await page.getByRole("tab", { name: tab }).click();
    assertCondition(
      (await page.getByRole("tab", { name: tab }).getAttribute("aria-selected")) === "true",
      `${tab} tab did not become selected.`,
    );
  }

  await page.getByRole("tab", { name: "Telephony" }).focus();
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assertCondition(focused === "SMS", "keyboard focus did not move from Telephony to SMS tab");
}

async function assertEndpointAndDuplicateBehavior(page: Page): Promise<void> {
  const matrixText = await page
    .locator("[data-testid='endpoint-provider-family-table']")
    .innerText();
  for (const token of [
    "/edge/signal/telephony/provider-callback",
    "/edge/signal/sms/status-callback",
    "/edge/signal/email/event-webhook",
    "Blocked",
  ]) {
    assertCondition(matrixText.includes(token), `endpoint matrix missing ${token}.`);
  }
  await page.getByRole("button", { name: "Probe duplicate endpoint" }).click();
  assertCondition(
    (await page
      .locator("[data-testid='duplicate-endpoint-warning']")
      .getAttribute("data-visible")) === "true",
    "duplicate endpoint warning did not become visible.",
  );
}

async function assertEventsSignatureReplayAndGates(page: Page): Promise<void> {
  const eventText = await page
    .locator("[data-testid='event-subscription-coverage-table']")
    .innerText();
  for (const token of [
    "call-status",
    "recording-status",
    "accepted",
    "expired",
    "bounced",
    "complaint",
  ]) {
    assertCondition(eventText.includes(token), `event matrix missing ${token}.`);
  }

  await page.getByRole("tab", { name: "Replay" }).click();
  const guardText = await page.locator("[data-testid='signature-replay-guard-board']").innerText();
  for (const token of ["Signature first", "300s replay window", "Credential refs only"]) {
    assertCondition(guardText.includes(token), `guard board missing ${token}.`);
  }

  const gateText = await page.locator("[data-testid='live-gate-checklist']").innerText();
  for (const token of [
    "ALLOW_SIGNAL_PROVIDER_MUTATION",
    "Credentials",
    "Approver",
    "rollback",
    "blocked",
  ]) {
    assertCondition(gateText.toLowerCase().includes(token.toLowerCase()), `gate missing ${token}.`);
  }
}

async function assertRedaction(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Evidence" }).click();
  const fullText = await page.locator("[data-testid='Signal_Edge_Control_Board']").innerText();
  for (const forbidden of [
    "client credential marker",
    "plain credential marker",
    "console password",
    "raw phone number",
  ]) {
    assertCondition(
      !fullText.toLowerCase().includes(forbidden),
      `Control board leaked ${forbidden}.`,
    );
  }
  assertCondition(
    fullText.includes("[REDACTED-HOST]"),
    "Evidence drawer does not show redacted host.",
  );
}

async function assertSelectorManifest(): Promise<void> {
  const selectors = JSON.parse(fs.readFileSync(SELECTORS_PATH, "utf8")) as {
    readonly providerConsoleSelectors: readonly {
      readonly provider: string;
      readonly mutationAllowedByDefault: boolean;
    }[];
  };
  for (const provider of [
    "twilio_voice",
    "vonage_voice",
    "twilio_sms",
    "vonage_sms",
    "mailgun_email",
    "sendgrid_email",
  ]) {
    const row = selectors.providerConsoleSelectors.find((item) => item.provider === provider);
    assertCondition(row, `Selector manifest missing ${provider}.`);
    assertCondition(
      row.mutationAllowedByDefault === false,
      `${provider} allows mutation by default.`,
    );
  }
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1280, height: 980 },
    { name: "mobile", width: 390, height: 860 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openBoard(page, url);
      await assertNoOverflow(page);
      await screenshot(page, `output/playwright/203-signal-edge-${size.name}.png`);
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
    await openBoard(reducedPage, url);
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='evidence-drawer']").waitFor();
    await screenshot(reducedPage, "output/playwright/203-signal-edge-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserSuite(browser: Browser): Promise<void> {
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  try {
    await openBoard(page, staticServer.url);
    await assertBoardStructure(page);
    await assertTabsAndKeyboard(page);
    await assertEndpointAndDuplicateBehavior(page);
    await assertEventsSignatureReplayAndGates(page);
    await assertRedaction(page);
    await assertSelectorManifest();
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/203-signal-edge-control-board.png");
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected203();
  await assertSelectorManifest();

  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log(
      "203 signal edge control board structural checks passed; use --run for browser proof",
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
  console.log("203 signal edge control board Playwright checks passed");
}

await main();
