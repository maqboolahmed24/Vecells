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
const ATLAS_PATH = path.join(ROOT, "docs", "frontend", "198_mobile_sms_continuation_atlas.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "198_mobile_sms_continuation_surface_contract.json",
);
const ENTRY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "198_continuation_entry_and_recovery_matrix.csv",
);
const STEP_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "198_mobile_step_restore_and_replay_cases.json",
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
      pathname = "/docs/frontend/198_mobile_sms_continuation_atlas.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/198_mobile_sms_continuation_atlas.html`,
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

function expected198() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, ENTRY_MATRIX_PATH, STEP_CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_198 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly screenFamilies: readonly string[];
    readonly privacyLaw: { readonly challengeShowsPreExistingDetailBeforeSuccess: boolean };
  };
  assertCondition(contract.visualMode === "Mobile_Continuation_Pulse", "Wrong visual mode.");
  assertCondition(
    contract.screenFamilies.includes("SeededContinuationLanding"),
    "Contract lost seeded screen.",
  );
  assertCondition(
    contract.screenFamilies.includes("ChallengeQuestionStep"),
    "Contract lost challenge step.",
  );
  assertCondition(
    contract.privacyLaw.challengeShowsPreExistingDetailBeforeSuccess === false,
    "Challenge privacy law drifted.",
  );
  return contract;
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Mobile_SMS_Continuation_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Mobile_SMS_Continuation_Route']").waitFor();
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

async function assertAtlas(page: Page): Promise<void> {
  for (const testId of [
    "seeded-vs-challenge-mobile-state-gallery",
    "mobile-flow-storyboard",
    "mobile-flow-storyboard-table",
    "replay-stale-link-mapping-table",
    "same-shell-uplift-return-diagram",
    "diagram-parity-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  const atlasText = await page.locator("[data-testid='Mobile_SMS_Continuation_Atlas']").innerText();
  assertCondition(
    atlasText.includes("Zero detail before challenge"),
    "Atlas missing challenge privacy state.",
  );
  assertCondition(atlasText.includes("No second path"), "Atlas missing replay parity state.");
}

async function assertSeededEntry(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/sms-continuation/seeded");
  const root = page.locator("[data-testid='Mobile_SMS_Continuation_Route']");
  assertCondition(
    (await root.getAttribute("data-screen-key")) === "SeededContinuationLanding",
    "Seeded route resolved wrong screen.",
  );
  await page.locator("[data-testid='captured-so-far-panel']").waitFor();
  const text = await page.locator("[data-testid='mobile-continuation-main']").innerText();
  assertCondition(
    text.includes("We have already captured some details"),
    "Seeded entry did not reveal safe captured context.",
  );
  await page.locator("[data-testid='mobile-continuation-progress']").waitFor();
  await page.getByRole("progressbar", { name: /Continuation progress/ }).waitFor();
  await page.locator("[data-testid='continuation-save-state-chip']").waitFor();
  await page.locator("[data-testid='dominant-next-safe-action']").waitFor();
}

async function assertChallengePrivacy(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/sms-continuation/challenge");
  const root = page.locator("[data-testid='Mobile_SMS_Continuation_Route']");
  assertCondition(
    (await root.getAttribute("data-screen-key")) === "ChallengeContinuationLanding",
    "Challenge landing resolved wrong screen.",
  );
  assertCondition(
    (await page.locator("[data-testid='captured-so-far-panel']").count()) === 0,
    "Challenge landing leaked captured panel.",
  );
  const challengeText = (
    await page.locator("[data-testid='mobile-continuation-main']").innerText()
  ).toLowerCase();
  for (const forbidden of [
    "we have already captured",
    "phone call from today",
    "callback request",
  ]) {
    assertCondition(!challengeText.includes(forbidden), `Challenge leaked ${forbidden}.`);
  }

  await openApp(page, baseUrl, "/sms-continuation/challenge-step");
  await page.locator("[data-testid='challenge-code-input']").fill("438219");
  await page.locator("[data-testid='challenge-continue-action']").click();
  await page.locator("[data-testid='screen-CapturedSoFarReview']").waitFor();
  await page.locator("[data-testid='captured-so-far-panel']").waitFor();
}

async function assertReplayStaleAndManual(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/sms-continuation/replay");
  const replayRoot = page.locator("[data-testid='Mobile_SMS_Continuation_Route']");
  assertCondition(
    (await replayRoot.getAttribute("data-screen-key")) === "ReplayMappedOutcome",
    "Replay route resolved wrong screen.",
  );
  const replayText = (
    await page.locator("[data-testid='screen-ReplayMappedOutcome']").innerText()
  ).toLowerCase();
  assertCondition(
    replayText.includes("does not create a second path"),
    "Replay did not settle duplicate mapping.",
  );
  assertCondition(
    (await page
      .locator("[data-testid='screen-ReplayMappedOutcome']")
      .getAttribute("data-redemption-state")) === "duplicate",
    "Replay did not expose duplicate redemption state.",
  );

  await openApp(page, baseUrl, "/sms-continuation/stale-link");
  await page.locator("[data-testid='continuation-recovery-bridge']").waitFor();
  await page.locator("[data-testid='recover-same-shell-action']").click();
  await page.locator("[data-testid='Mobile_SMS_Continuation_Route']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='Mobile_SMS_Continuation_Route']")
      .getAttribute("data-screen-key")) === "StaleLinkRecoveryBridge",
    "Stale recovery dropped away from same shell.",
  );
  assertCondition(
    page.url().includes("/sms-continuation/recovery"),
    "Stale recovery did not route to recovery bridge.",
  );

  await openApp(page, baseUrl, "/sms-continuation/manual-only");
  await page.locator("[data-testid='manual-only-outcome']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='Mobile_SMS_Continuation_Route']")
      .getAttribute("data-screen-key")) === "ManualOnlyOutcome",
    "Manual-only route resolved wrong screen.",
  );
  const manualText = (
    await page.locator("[data-testid='mobile-continuation-main']").innerText()
  ).toLowerCase();
  assertCondition(
    manualText.includes("not a redeemable continuation"),
    "Manual-only outcome not explicit.",
  );
  assertCondition(
    !manualText.includes("phone call from today"),
    "Manual-only leaked seeded context.",
  );
}

async function assertRefreshAndUplift(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/sms-continuation/detail");
  await page
    .locator("[data-testid='continuation-detail-input']")
    .fill("Persistent detail after step-up.");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='screen-AddMoreDetailStep']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='continuation-detail-input']").inputValue()) ===
      "Persistent detail after step-up.",
    "Refresh did not preserve selected mobile step and save state.",
  );
  assertCondition(
    (await page
      .locator("[data-testid='continuation-save-state-chip']")
      .getAttribute("data-selected-step")) === "add_detail",
    "Save chip did not expose selected step.",
  );

  await page.locator("[data-testid='secondary-safe-action']").click();
  await page.locator("[data-testid='Mobile_SMS_Continuation_Route']").waitFor();
  assertCondition(
    page.url().includes("/sms-continuation/sign-in-return"),
    "Sign-in uplift did not use return route.",
  );
  assertCondition(
    (await page
      .locator("[data-testid='Mobile_SMS_Continuation_Route']")
      .getAttribute("data-selected-step")) === "add_detail",
    "Sign-in uplift did not return to same selected step.",
  );
  await page
    .locator("[data-testid='mobile-continuation-main']")
    .getByText("same continuation shell")
    .waitFor();
  const upliftText = await page.locator("[data-testid='mobile-continuation-main']").innerText();
  assertCondition(
    upliftText.includes("same continuation shell"),
    "Sign-in uplift did not preserve same-shell copy.",
  );
}

async function assertUploadAndAria(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/sms-continuation/upload");
  await page.locator("[data-testid='upload-tray-mobile']").waitFor();
  const uploadPath = path.join(ROOT, "output", "playwright", "198-upload-evidence.txt");
  fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
  fs.writeFileSync(uploadPath, "mobile continuation upload evidence");
  await page.locator("[data-testid='upload-file-input']").setInputFiles(uploadPath);
  const uploadText = await page.locator("[data-testid='upload-name-list']").innerText();
  assertCondition(
    uploadText.includes("198-upload-evidence.txt"),
    "Mobile upload interaction failed.",
  );
  await page.locator("[data-testid='dominant-next-safe-action']").waitFor();
  const progress = page.locator("[data-testid='mobile-continuation-progress']");
  assertCondition(
    (await progress.getAttribute("role")) === "progressbar",
    "Progress missing ARIA role.",
  );
  assertCondition(
    (await progress.getAttribute("aria-valuenow")) === "4",
    "Progress aria-valuenow drifted.",
  );
  await page.keyboard.press("Tab");
  const focused = await activeTestId(page);
  assertCondition(focused !== null, "Keyboard focus did not land on a testable control.");
  const saveChip = page.locator("[data-testid='continuation-save-state-chip']");
  assertCondition(
    (await saveChip.getAttribute("role")) === "status",
    "Save chip missing status role.",
  );
}

async function assertResponsiveAndReducedMotion(browser: Browser, baseUrl: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1440, height: 1040 },
    { name: "tablet", width: 860, height: 980 },
    { name: "mobile", width: 390, height: 880 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openApp(page, baseUrl, "/sms-continuation/upload");
      await assertNoOverflow(page);
      const shellWidth = await page
        .locator("[data-testid='mobile-continuation-main']")
        .evaluate((node) => {
          return Math.round((node as HTMLElement).getBoundingClientRect().width);
        });
      assertCondition(
        shellWidth <= 430,
        `Mobile shell exceeded 430px at ${size.name}: ${shellWidth}`,
      );
      await screenshot(page, `output/playwright/198-mobile-continuation-${size.name}.png`);
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
    await openApp(reducedPage, baseUrl, "/sms-continuation/seeded");
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='dominant-next-safe-action']").waitFor();
    await screenshot(reducedPage, "output/playwright/198-mobile-continuation-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected198();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/198-mobile-continuation-atlas.png");
    await assertSeededEntry(page, patientWeb.baseUrl);
    await assertChallengePrivacy(page, patientWeb.baseUrl);
    await assertReplayStaleAndManual(page, patientWeb.baseUrl);
    await assertRefreshAndUplift(page, patientWeb.baseUrl);
    await assertUploadAndAria(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected198();
  if (!process.argv.includes("--run")) {
    console.log("198_mobile_sms_continuation_flow_for_callers.spec.ts: syntax ok");
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
