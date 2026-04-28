import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import { writePhase7ChannelReconciliationArtifacts } from "../../tools/conformance/reconcile_473_phase7_deferred_channel";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4348";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "473-phase7-channel");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|https?:\/\//i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4348", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/conformance?phase7ChannelState=deferred`, 25_000);
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

function assertNoSensitiveSerialized(value: string | Buffer, label: string): void {
  const serialized = Buffer.isBuffer(value) ? value.toString("latin1") : value;
  assert(!serialized.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
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

async function captureChannelScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='phase7-channel-reconciliation']").screenshot({
    path: screenshotPath,
  });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

export async function run(): Promise<void> {
  writePhase7ChannelReconciliationArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1180 },
    reducedMotion: "reduce",
    colorScheme: "dark",
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
    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=deferred`, {
      waitUntil: "networkidle",
    });
    const surface = page.locator("[data-testid='phase7-channel-reconciliation']");
    const rail = page.locator("[data-testid='phase7-channel-readiness-rail']");
    const matrix = page.locator("[data-testid='phase7-channel-matrix']");
    const routeMatrix = page.locator("[data-testid='phase7-embedded-route-matrix']");
    const sourceTrace = page.locator("[data-testid='phase7-channel-source-trace-drawer']");
    const reconcile = page.locator("[data-testid='phase7-reconcile-as-complete']");
    await surface.waitFor();
    await expectAttribute(surface, "data-readiness-state", "deferred");
    await expectAttribute(surface, "data-row-state", "deferred_scope");
    await expectAttribute(surface, "data-scorecard-state", "exact");
    await expectAttribute(surface, "data-channel-activation-permitted", "false");
    await expectAttribute(surface, "data-no-raw-artifact-urls", "true");
    assert(await reconcile.isDisabled(), "Deferred channel reconciliation must be disabled.");
    assert(
      (await page.locator("[data-testid^='phase7-channel-blocker-']").count()) >= 3,
      "Deferred state must expose channel blockers.",
    );
    await writeAriaSnapshot(surface, "473-deferred-scorecard.aria.txt");
    await writeAriaSnapshot(rail, "473-deferred-readiness-rail.aria.txt");
    await writeAriaSnapshot(matrix, "473-deferred-control-matrix.aria.txt");
    await writeAriaSnapshot(sourceTrace, "473-deferred-source-trace.aria.txt");
    await captureChannelScreenshot(page, "473-deferred-channel.png");

    const pharmacyHashButton = page.locator("[data-testid='phase7-copy-hash-pharmacy']");
    await pharmacyHashButton.focus();
    await page.keyboard.press("Tab");
    const activeLabel = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent ?? "",
    );
    assert(activeLabel.length > 0, "Keyboard navigation should reach a named control.");
    await page.getByRole("button", { name: "Pharmacy", exact: true }).click();
    await expectAttribute(surface, "data-selected-route-family", "pharmacy");

    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=exact`, {
      waitUntil: "networkidle",
    });
    await surface.waitFor();
    await expectAttribute(surface, "data-readiness-state", "ready_to_reconcile");
    await expectAttribute(surface, "data-row-state", "exact");
    await expectAttribute(surface, "data-channel-activation-permitted", "true");
    assert(
      !(await reconcile.isDisabled()),
      "Exact channel scenario should enable reconcile action.",
    );
    assert(
      (await routeMatrix.locator("tbody tr[data-coverage-state='exact']").count()) >= 7,
      "Exact scenario should render route coverage as exact.",
    );
    await writeAriaSnapshot(surface, "473-exact-scorecard.aria.txt");
    await captureChannelScreenshot(page, "473-exact-channel.png");

    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=blocked`, {
      waitUntil: "networkidle",
    });
    await surface.waitFor();
    await expectAttribute(surface, "data-readiness-state", "blocked");
    await expectAttribute(surface, "data-scorecard-state", "blocked");
    await expectAttribute(surface, "data-reconcile-action-state", "frozen_until_authority_exact");
    assert(await reconcile.isDisabled(), "Blocked channel reconciliation must be disabled.");
    await expectAttribute(
      page.locator("[data-testid='phase7-route-row-booking']"),
      "data-coverage-state",
      "blocked",
    );
    await captureChannelScreenshot(page, "473-blocked-channel.png");

    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=stale`, {
      waitUntil: "networkidle",
    });
    await surface.waitFor();
    await expectAttribute(surface, "data-readiness-state", "stale");
    await expectAttribute(surface, "data-reconcile-action-state", "frozen_until_authority_exact");
    assert(await reconcile.isDisabled(), "Stale manifest/runtime tuple must freeze reconcile.");
    await expectAttribute(
      page.locator("[data-testid='phase7-route-row-status']"),
      "data-coverage-state",
      "stale",
    );
    await writeAriaSnapshot(routeMatrix, "473-stale-route-matrix.aria.txt");

    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=not_applicable`, {
      waitUntil: "networkidle",
    });
    await surface.waitFor();
    await expectAttribute(surface, "data-readiness-state", "not_applicable");
    await expectAttribute(surface, "data-channel-activation-permitted", "false");
    await expectAttribute(
      page.locator("[data-testid='phase7-route-row-unsupported_bridge_capability']"),
      "data-coverage-state",
      "not_applicable",
    );

    await page.setViewportSize({ width: 390, height: 980 });
    await page.goto(`${APP_URL}/ops/conformance?phase7ChannelState=deferred`, {
      waitUntil: "networkidle",
    });
    await surface.waitFor();
    await expectAttribute(surface, "data-responsive-contract", "mission_stack_blockers_visible");
    assert(
      await page.locator("[data-testid='phase7-channel-blockers']").isVisible(),
      "Narrow layout must keep blockers visible.",
    );
    await writeAriaSnapshot(surface, "473-mobile-deferred-scorecard.aria.txt");

    assertNoSensitiveSerialized(
      await surface.evaluate((node: HTMLElement) => node.innerText),
      "phase7 channel surface",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "473-phase7-channel-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "473-phase7-channel-failure-trace.zip"),
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
