import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build476ReleaseWaveArtifacts,
  write476ReleaseWaveArtifacts,
} from "../../tools/release/plan_476_release_waves";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4351";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "476-release-wave-planner");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|https?:\/\//i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4351", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/conformance?waveState=approved`, 25_000);
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

async function captureWaveScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='release-476-planner']").screenshot({ path: screenshotPath });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

async function gotoWavePlanner(
  page: any,
  state: string,
  wave = "wave_476_1_core_web_canary",
): Promise<any> {
  await page.goto(`${APP_URL}/ops/conformance?waveState=${state}&wave=${wave}`, {
    waitUntil: "networkidle",
  });
  const planner = page.locator("[data-testid='release-476-planner']");
  await planner.waitFor();
  await planner.scrollIntoViewIfNeeded();
  return planner;
}

export async function run(): Promise<void> {
  write476ReleaseWaveArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const blockedArtifacts = build476ReleaseWaveArtifacts("blocked");
  assert.equal(
    blockedArtifacts.releaseWaveManifest.overallReadinessVerdict,
    "blocked",
    "API-side stale prerequisite scenario must block approval.",
  );
  const supersededArtifacts = build476ReleaseWaveArtifacts("superseded");
  assert.equal(
    supersededArtifacts.releaseWaveManifest.deploymentWaves[0].verdict,
    "superseded",
    "API-side superseded runtime scenario must supersede Wave 1.",
  );

  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1280 },
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
    const planner = await gotoWavePlanner(page, "approved");
    await expectAttribute(planner, "data-wave1-smallest-blast-radius", "true");
    await expectAttribute(planner, "data-activation-permitted", "false");
    await expectAttribute(planner, "data-readiness-verdict", "eligible_with_constraints");

    const wave1 = page.getByRole("button", { name: /Wave 1/i });
    await expectAttribute(wave1, "data-wave-state", "approved");
    const wave1Text = await wave1.evaluate((node: HTMLElement) => node.innerText);
    assert(wave1Text.includes("NHS App excluded"), "Wave 1 must exclude NHS App scope.");
    assert(
      wave1Text.includes("assistive visible excluded"),
      "Wave 1 must exclude assistive visible scope.",
    );
    assert(
      wave1Text.includes("Exposure score 33"),
      "Wave 1 must show the smallest approved exposure score.",
    );

    await page.getByRole("button", { name: /Wave 2/i }).click();
    await expectAttribute(
      planner,
      "data-selected-wave-id",
      "wave_476_2_core_web_staff_pharmacy_after_projection",
    );
    const detailsPane = page.getByRole("region", { name: /Task 476 details/i });
    const guardrailTable = page.getByRole("table", { name: /Interval, threshold/i });
    const rollbackDrawer = page.getByRole("region", { name: /rollback binding drawer/i });
    await detailsPane.waitFor();
    await guardrailTable.waitFor();
    await rollbackDrawer.waitFor();
    assert(
      (await rollbackDrawer.evaluate((node: HTMLElement) => node.innerText)).includes(
        "Blocked until exact",
      ),
      "Wave 2 rollback drawer must show the reference-data gap.",
    );

    await writeAriaSnapshot(
      page.locator("[data-testid='release-476-wave-ladder']"),
      "476-wave-ladder.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='release-476-guardrail-table']"),
      "476-guardrail-table.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='release-476-blast-radius-matrix']"),
      "476-blast-radius-matrix.aria.txt",
    );

    await page.locator("[data-testid='release-476-approve-wave']").click();
    const commandDialog = page.getByRole("dialog", { name: /command confirmation/i });
    await commandDialog.waitFor();
    await writeAriaSnapshot(commandDialog, "476-command-dialog.aria.txt");
    assert(
      await page.getByRole("button", { name: /Confirm activation/i }).isDisabled(),
      "Command dialog must not permit activation without authoritative settlements.",
    );
    await page.getByRole("button", { name: /Close command review/i }).click();
    await captureWaveScreenshot(page, "476-approved-wave-planner.png");

    await page
      .locator("[data-testid='release-476-wave-card-wave_476_assistive_narrow_staff_cohort']")
      .focus();
    await page.keyboard.press("Enter");
    await expectAttribute(
      planner,
      "data-selected-wave-id",
      "wave_476_assistive_narrow_staff_cohort",
    );
    await page.locator("[data-testid='release-476-close-details']").click();
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
    );
    assert.equal(
      activeTestId,
      "release-476-wave-card-wave_476_assistive_narrow_staff_cohort",
      "Focus should return to the selected wave card after closing details.",
    );

    for (const state of ["draft", "active", "paused", "blocked", "superseded"]) {
      await gotoWavePlanner(page, state);
      await captureWaveScreenshot(page, `476-${state}-wave-planner.png`);
    }

    await gotoWavePlanner(page, "blocked");
    await expectAttribute(planner, "data-readiness-verdict", "blocked");
    assert(
      await page.locator("[data-testid='release-476-approve-wave']").isDisabled(),
      "Blocked stale prerequisite state must disable approval review.",
    );
    const blockedText = await planner.evaluate((node: HTMLElement) => node.innerText);
    assert(
      blockedText.includes("blocker:476:phase7-channel-reconciliation-stale"),
      "Blocked state must show source blockers.",
    );

    await page.setViewportSize({ width: 390, height: 980 });
    await gotoWavePlanner(page, "approved");
    await expectAttribute(planner, "data-responsive-contract", "release_wave_tables_preserved");
    assert(await page.locator("[data-testid='release-476-wave-ladder']").isVisible());
    assert(await page.locator("[data-testid='release-476-blast-radius-matrix']").isVisible());
    await writeAriaSnapshot(planner, "476-mobile-approved-planner.aria.txt");

    assertNoSensitiveSerialized(
      await planner.evaluate((node: HTMLElement) => node.innerText),
      "release wave planner",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "476-release-wave-planner-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "476-release-wave-planner-failure-trace.zip"),
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
