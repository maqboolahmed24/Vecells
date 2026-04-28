import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build478DependencyReadinessArtifacts,
  write478DependencyReadinessArtifacts,
} from "../../tools/readiness/plan_478_dependencies";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4353";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "478-dependency-readiness-board");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|@nhs\.net/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4353", "--strictPort"],
    {
      cwd: APP_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/ops/dependencies?dependencyState=ready`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopOpsConsole(child: ChildProcessWithoutNullStreams): Promise<void> {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function assertNoSensitiveSerialized(value: string | Buffer, label: string): void {
  const serialized = Buffer.isBuffer(value) ? value.toString("latin1") : value;
  assert(!serialized.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

async function writeAriaSnapshot(locator: any, name: string): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const serialized =
    typeof locator.ariaSnapshot === "function"
      ? String(await locator.ariaSnapshot())
      : String(await locator.evaluate((node: HTMLElement) => node.innerText));
  fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
  assertNoSensitiveSerialized(serialized, name);
}

async function captureBoardScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='dependency-478-board']").screenshot({
    path: screenshotPath,
  });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

async function gotoBoard(page: any, state: string, dependency?: string): Promise<any> {
  const dependencyParam = dependency ? `&dependency=${dependency}` : "";
  await page.goto(`${APP_URL}/ops/dependencies?dependencyState=${state}${dependencyParam}`, {
    waitUntil: "networkidle",
  });
  const board = page.locator("[data-testid='dependency-478-board']");
  await board.waitFor();
  await board.scrollIntoViewIfNeeded();
  return board;
}

async function assertLaunchCriticalCardsHaveFallback(page: any): Promise<void> {
  const cards = page.locator("[data-testid^='dependency-478-card-'][data-launch-critical='true']");
  const count = await cards.count();
  assert(count >= 8, "Launch-critical dependency cards must be visible.");
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const readinessState = await card.getAttribute("data-readiness-state");
    assert(
      readinessState === "ready" || readinessState === "ready_with_constraints",
      `Launch-critical dependency ${index} must have a launchable readiness state.`,
    );
    const text = await card.innerText();
    assert(
      text.includes("Fallback:"),
      `Launch-critical dependency ${index} must show fallback binding.`,
    );
    assertNoSensitiveSerialized(text, `launch-critical-card-${index}`);
  }
}

export async function run(): Promise<void> {
  write478DependencyReadinessArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  assert.equal(
    (build478DependencyReadinessArtifacts("stale_contact").matrix as any).overallReadinessState,
    "blocked",
    "API-side stale supplier contact fixture must block readiness.",
  );
  assert.equal(
    (build478DependencyReadinessArtifacts("blocked").matrix as any).overallReadinessState,
    "blocked",
    "API-side missing owner rota or restore report fixture must block readiness.",
  );

  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1320 },
    reducedMotion: "reduce",
    colorScheme: "dark",
    forcedColors: "active",
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    if (!request.url().includes("/@vite/client")) {
      requestFailures.push(`${request.method()} ${request.url()}`);
    }
  });

  try {
    const board = await gotoBoard(page, "ready");
    await expectAttribute(board, "data-overall-readiness-state", "ready");
    await expectAttribute(board, "data-no-completion-claim-before-settlement", "true");
    await assertLaunchCriticalCardsHaveFallback(page);

    await writeAriaSnapshot(
      page.locator("[data-testid='dependency-478-constellation-table']"),
      "478-constellation-table.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='dependency-478-continuity-strip']"),
      "478-continuity-strip.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='dependency-478-contact-ledger']"),
      "478-contact-ledger.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='dependency-478-runbook-drawer']"),
      "478-runbook-drawer.aria.txt",
    );

    const notificationCard = page.locator(
      "[data-testid='dependency-478-card-dep_478_notification_provider']",
    );
    await notificationCard.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-testid='dependency-478-runbook-drawer']");
    await drawer.waitFor();
    assert(
      (await drawer.innerText()).includes("Notification provider manual contact fallback"),
      "Keyboard selection should open the selected dependency drawer.",
    );
    await page.locator("[data-testid='dependency-478-close-runbook-drawer']").click();
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
    );
    assert.equal(
      activeTestId,
      "dependency-478-card-dep_478_notification_provider",
      "Focus should return to selected dependency card after drawer close.",
    );

    await page.locator("[data-testid='dependency-478-activation-action']").click();
    const commandDialog = page.getByRole("dialog", {
      name: /Fallback activation command review/i,
    });
    await commandDialog.waitFor();
    assert(
      await page.locator("[data-testid='dependency-478-command-confirm']").isDisabled(),
      "Fallback activation must not claim completion before backend settlement.",
    );
    assert(
      (await commandDialog.innerText()).includes("disabled until backend command settlement"),
      "Command dialog must explain the pending settlement gate.",
    );
    await writeAriaSnapshot(commandDialog, "478-command-dialog.aria.txt");
    await page.getByRole("button", { name: /Close command review/i }).click();
    await captureBoardScreenshot(page, "478-ready-dependency-readiness-board.png");

    await gotoBoard(page, "degraded_manual");
    await expectAttribute(
      page.locator("[data-testid='dependency-478-card-dep_478_booking_provider_adapter']"),
      "data-readiness-state",
      "ready_with_constraints",
    );
    assert(
      (await page.locator("[data-testid='dependency-478-continuity-strip']").innerText()).includes(
        "Manual",
      ),
      "Degraded/manual scenario must show manual continuity state.",
    );
    await captureBoardScreenshot(page, "478-degraded-manual-dependency-readiness-board.png");

    await gotoBoard(page, "blocked");
    await expectAttribute(board, "data-overall-readiness-state", "blocked");
    assert(
      await page.locator("[data-testid='dependency-478-activation-action']").isDisabled(),
      "Blocked dependency state must disable fallback activation review.",
    );
    await captureBoardScreenshot(page, "478-blocked-dependency-readiness-board.png");

    await gotoBoard(page, "deferred_channel", "dep_478_nhs_app_channel");
    await expectAttribute(
      page.locator("[data-testid='dependency-478-card-dep_478_nhs_app_channel']"),
      "data-readiness-state",
      "not_applicable",
    );
    assert(
      (await page.locator("[data-testid='dependency-478-runbook-drawer']").innerText()).includes(
        "NHS App deferred channel route freeze",
      ),
      "Deferred-channel state must expose NHS App route freeze runbook.",
    );
    await captureBoardScreenshot(page, "478-deferred-channel-dependency-readiness-board.png");

    await gotoBoard(page, "stale_contact", "dep_478_supplier_support_channel");
    await expectAttribute(
      page.locator("[data-testid='dependency-478-board']"),
      "data-fallback-activation-action-state",
      "blocked_by_stale_contact",
    );
    assert(
      (await page.locator("[data-testid='dependency-478-contact-ledger']").innerText()).includes(
        "Expired Role Phone Email Unverified",
      ),
      "Stale supplier contact scenario must show expired role/phone/email verification.",
    );
    assert(
      await page.locator("[data-testid='dependency-478-activation-action']").isDisabled(),
      "Stale supplier contact must block or constrain fallback activation review.",
    );

    await page.setViewportSize({ width: 390, height: 1040 });
    await gotoBoard(page, "degraded_manual");
    await page.locator("[data-testid='dependency-478-constellation-table']").waitFor();
    await page.locator("[data-testid='dependency-478-contact-ledger']").waitFor();
    await writeAriaSnapshot(
      page.locator("[data-testid='dependency-478-board']"),
      "478-mobile-dependency-board.aria.txt",
    );

    assertNoSensitiveSerialized(
      await page.locator("[data-testid='dependency-478-board']").innerText(),
      "dependency readiness board",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "478-dependency-readiness-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "478-dependency-readiness-failure-trace.zip"),
    });
    throw error;
  } finally {
    await browser.close();
    await stopOpsConsole(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
