import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Browser, Locator, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "201_cross_channel_receipt_and_status_parity_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "201_receipt_and_status_parity_contract.json",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "201_channel_parity_matrix.csv");
const DRIFT_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "201_provenance_note_allowlist_and_status_drift_cases.json",
);

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
}

interface PatientWebServer {
  readonly child: ChildProcess;
  readonly baseUrl: string;
}

type StatusSnapshot = {
  readonly semanticStatusKey: string;
  readonly statusHeadline: string;
  readonly etaBucket: string;
  readonly promiseState: string;
};

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
      pathname = "/docs/frontend/201_cross_channel_receipt_and_status_parity_atlas.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/201_cross_channel_receipt_and_status_parity_atlas.html`,
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
      // Keep polling until Vite is reachable.
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

function expected201(): void {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, DRIFT_CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_201 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly reusablePrimitives: readonly string[];
    readonly statusParityLaw: {
      readonly sameRequestTruthProducesSameStatusMeaning: boolean;
      readonly provenanceNotesPrimaryStatusForbidden: boolean;
      readonly publicSafeNarrowingChangesCoreMeaning: boolean;
    };
  };
  assertCondition(contract.visualMode === "Parity_Status_Atlas", "Wrong visual mode.");
  for (const primitive of [
    "ReceiptHero",
    "RequestStatusStrip",
    "RequestStatusSummaryCard",
    "ProvenanceContextChipRow",
    "ReceiptOutcomeBridge",
  ]) {
    assertCondition(contract.reusablePrimitives.includes(primitive), `Missing ${primitive}.`);
  }
  assertCondition(
    contract.statusParityLaw.sameRequestTruthProducesSameStatusMeaning,
    "Same request truth does not require same status meaning.",
  );
  assertCondition(
    contract.statusParityLaw.provenanceNotesPrimaryStatusForbidden,
    "Provenance notes can become primary status.",
  );
  assertCondition(
    contract.statusParityLaw.publicSafeNarrowingChangesCoreMeaning === false,
    "Public-safe narrowing changes core meaning.",
  );
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Cross_Channel_Receipt_Status_Parity_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Cross_Channel_Receipt_Status_Parity_Route']").waitFor();
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

async function stripSnapshot(locator: Locator): Promise<StatusSnapshot> {
  return {
    semanticStatusKey: (await locator.getAttribute("data-semantic-status-key")) ?? "",
    statusHeadline: (await locator.getAttribute("data-status-headline")) ?? "",
    etaBucket: (await locator.getAttribute("data-eta-bucket")) ?? "",
    promiseState: (await locator.getAttribute("data-promise-state")) ?? "",
  };
}

async function assertAtlas(page: Page): Promise<void> {
  for (const testId of [
    "side-by-side-channel-comparison-board",
    "side-by-side-channel-comparison-table",
    "source-to-surface-parity-table",
    "source-to-surface-table",
    "provenance-note-gallery",
    "provenance-note-table",
    "receipt-consistency-diagram",
    "receipt-consistency-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  const atlasText = await page
    .locator("[data-testid='Cross_Channel_Receipt_Status_Parity_Atlas']")
    .innerText();
  assertCondition(
    atlasText.includes("Your request is being reviewed"),
    "Atlas lost canonical status wording.",
  );
  assertCondition(
    atlasText.includes("pending_review|within_2_working_days|on_track|not_required"),
    "Atlas lost semantic status key proof.",
  );
  assertCondition(atlasText.includes("Additive only"), "Atlas lost provenance additive proof.");
}

async function assertEquivalentStatusAcrossContexts(page: Page, baseUrl: string): Promise<void> {
  const paths = [
    "/portal/receipt-status-parity",
    "/status/REQ-4219",
    "/phone/receipt/REQ-4219",
    "/continue/receipt/REQ-4219",
  ];
  const snapshots: StatusSnapshot[] = [];
  for (const pathname of paths) {
    await openApp(page, baseUrl, pathname);
    const root = page.locator("[data-testid='Cross_Channel_Receipt_Status_Parity_Route']");
    const strip = page.locator("[data-testid='receipt-hero'] [data-testid='request-status-strip']");
    const snapshot = await stripSnapshot(strip);
    assertCondition(
      (await root.getAttribute("data-semantic-status-key")) === snapshot.semanticStatusKey,
      `${pathname} root semantic-status-key differs from the receipt strip.`,
    );
    assertCondition(
      (await strip.getAttribute("data-same-status-meaning")) === "true",
      `${pathname} is not marked as same status meaning.`,
    );
    snapshots.push(snapshot);
  }
  const first = snapshots[0];
  for (const snapshot of snapshots.slice(1)) {
    assertCondition(
      JSON.stringify(snapshot) === JSON.stringify(first),
      `Equivalent channel status drifted: ${JSON.stringify(snapshot)} vs ${JSON.stringify(first)}`,
    );
  }
}

async function assertProvenanceCannotDriveStatus(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/phone/receipt/REQ-4219");
  const primarySnapshot = await stripSnapshot(
    page.locator("[data-testid='receipt-hero'] [data-testid='request-status-strip']"),
  );
  const chips = page.locator("[data-testid='provenance-context-chip-row']").first().locator("li");
  const chipCount = await chips.count();
  assertCondition(chipCount >= 2, "Phone-origin surface lost provenance notes.");
  for (let index = 0; index < chipCount; index += 1) {
    const chip = chips.nth(index);
    assertCondition(
      (await chip.getAttribute("data-additive-only")) === "true",
      "Provenance chip is not additive-only.",
    );
    assertCondition(
      (await chip.getAttribute("data-primary-status-forbidden")) === "true",
      "Provenance chip can become primary status.",
    );
    assertCondition(
      (await chip.innerText()).includes(primarySnapshot.statusHeadline) === false,
      "Provenance chip duplicated the primary status headline.",
    );
  }

  await openApp(page, baseUrl, "/continue/receipt/REQ-4219");
  const continuationSnapshot = await stripSnapshot(
    page.locator("[data-testid='receipt-hero'] [data-testid='request-status-strip']"),
  );
  assertCondition(
    continuationSnapshot.semanticStatusKey === primarySnapshot.semanticStatusKey,
    "SMS provenance changed the semantic status key.",
  );
}

async function assertListReceiptDetailAlignment(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/receipt-status-parity");
  await page.locator("[data-testid='channel-parity-board']").waitFor();
  await page.locator("[data-testid='request-status-summary-card']").first().waitFor();
  const receipt = await stripSnapshot(
    page.locator("[data-testid='receipt-hero'] [data-testid='request-status-strip']"),
  );
  const list = await stripSnapshot(
    page.locator("[data-testid='parity-list-row-surface'] [data-testid='request-status-strip']"),
  );
  const detail = await stripSnapshot(
    page.locator(
      "[data-testid='parity-detail-header-surface'] [data-testid='request-status-strip']",
    ),
  );
  const signedOut = await stripSnapshot(
    page.locator(
      "[data-testid='signed-out-minimal-status-surface'] [data-testid='request-status-strip']",
    ),
  );
  for (const snapshot of [list, detail, signedOut]) {
    assertCondition(
      snapshot.semanticStatusKey === receipt.semanticStatusKey,
      `Surface status key drifted from receipt: ${JSON.stringify(snapshot)}`,
    );
    assertCondition(
      snapshot.statusHeadline === receipt.statusHeadline &&
        snapshot.etaBucket === receipt.etaBucket &&
        snapshot.promiseState === receipt.promiseState,
      `List/receipt/detail status fields disagree: ${JSON.stringify(snapshot)}`,
    );
  }

  const bridge = page.locator("[data-testid='receipt-outcome-bridge']");
  assertCondition(
    (await bridge.getAttribute("data-list-row-agrees")) === "true",
    "Outcome bridge says list row disagrees with receipt.",
  );
  assertCondition(
    (await bridge.getAttribute("data-detail-header-agrees")) === "true",
    "Outcome bridge says detail header disagrees with receipt.",
  );
  assertCondition(
    (await bridge.getAttribute("data-public-safe-core-meaning-changed")) === "false",
    "Outcome bridge allows public-safe core meaning drift.",
  );

  await openApp(page, baseUrl, "/portal/receipt-status-parity/blocked");
  const blockedBridge = page.locator("[data-testid='receipt-outcome-bridge']");
  assertCondition(
    (await blockedBridge.getAttribute("data-mapped-recovery-outcome")) ===
      "contact_repair_required",
    "Blocked route did not map to the recovery posture.",
  );
}

async function assertPublicSafeNarrowing(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/status/REQ-4219");
  const hero = page.locator("[data-testid='receipt-hero']");
  assertCondition(
    (await hero.getAttribute("data-audience-coverage")) === "public_safe",
    "Signed-out status route is not public_safe.",
  );
  const routeText = (
    await page.locator("[data-testid='Cross_Channel_Receipt_Status_Parity_Route']").innerText()
  ).toLowerCase();
  for (const forbidden of [
    "message bodies",
    "attachment names",
    "staff notes",
    "raw identifiers",
  ]) {
    assertCondition(
      !routeText.includes(forbidden),
      `Public-safe route leaked authenticated-only detail: ${forbidden}`,
    );
  }
}

async function assertKeyboardSemantics(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/receipt-status-parity");
  await page.getByRole("button", { name: "Phone" }).focus();
  const focusedText = await page.evaluate(() => document.activeElement?.textContent ?? "");
  assertCondition(focusedText.trim() === "Phone", "Keyboard focus did not land on Phone nav.");
  await page.keyboard.press("Enter");
  await page.locator("[data-selected-channel='phone_origin']").waitFor();
  const liveRegion = page.locator("[data-testid='receipt-status-live-region']");
  assertCondition((await liveRegion.getAttribute("aria-live")) === "polite", "Missing aria-live.");
  assertCondition(
    (await page.getByRole("heading", { name: "Your request is being reviewed" }).count()) >= 1,
    "Canonical status heading is not exposed as a heading.",
  );
  await page.getByRole("button", { name: "Blocked" }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("heading", { name: "A repair is needed before this request can move" })
    .waitFor();
}

async function assertResponsiveAndReducedMotion(browser: Browser, baseUrl: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1280, height: 1040 },
    { name: "tablet", width: 900, height: 980 },
    { name: "mobile", width: 390, height: 880 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openApp(page, baseUrl, "/portal/receipt-status-parity");
      await assertNoOverflow(page);
      const heroBox = await page.locator("[data-testid='receipt-hero']").boundingBox();
      const stripBox = await page
        .locator("[data-testid='receipt-hero'] [data-testid='request-status-strip']")
        .boundingBox();
      assertCondition(heroBox && heroBox.width <= size.width, "Receipt hero overflows viewport.");
      assertCondition(
        stripBox && stripBox.height >= 40 && stripBox.height <= 72,
        "Status strip height drifted outside the 40-48px responsive tolerance.",
      );
      await screenshot(page, `output/playwright/201-receipt-status-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 880 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openApp(reducedPage, baseUrl, "/portal/receipt-status-parity");
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='receipt-hero']").waitFor();
    await screenshot(reducedPage, "output/playwright/201-receipt-status-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected201();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/201-receipt-status-atlas.png");
    await assertEquivalentStatusAcrossContexts(page, patientWeb.baseUrl);
    await assertProvenanceCannotDriveStatus(page, patientWeb.baseUrl);
    await assertListReceiptDetailAlignment(page, patientWeb.baseUrl);
    await assertPublicSafeNarrowing(page, patientWeb.baseUrl);
    await assertKeyboardSemantics(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected201();
  if (!process.argv.includes("--run")) {
    console.log("201_cross_channel_receipt_and_status_parity_surfaces.spec.ts: syntax ok");
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
