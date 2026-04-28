import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import { writeProgrammeConformanceArtifacts } from "../../tools/conformance/generate_472_programme_conformance_scorecard";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4347";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "472-programme-conformance");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|https?:\/\//i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4347", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/conformance?programme=472`, 25_000);
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

async function writeProgrammeAriaSnapshot(page: any, name: string): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const surface = page.locator("[data-testid='programme-472-scorecard']");
  const serialized =
    typeof surface.ariaSnapshot === "function"
      ? String(await surface.ariaSnapshot())
      : String(await surface.evaluate((node: HTMLElement) => node.innerText));
  fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
  assertNoSensitiveSerialized(serialized, name);
}

async function captureProgrammeScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='programme-472-scorecard']").screenshot({
    path: screenshotPath,
  });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

export async function run(): Promise<void> {
  writeProgrammeConformanceArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1180 },
    reducedMotion: "reduce",
  });
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
    await page.goto(`${APP_URL}/ops/conformance?programme=472&programmeState=exact`, {
      waitUntil: "networkidle",
    });
    const programme = page.locator("[data-testid='programme-472-scorecard']");
    const table = page.locator("[data-testid='programme-472-row-table']");
    const deferred = page.locator("[data-testid='programme-472-deferred-scope']");
    const corrections = page.locator("[data-testid='programme-472-summary-corrections']");
    const sourceTrace = page.locator("[data-testid='programme-472-source-trace-drawer']");
    const handoff = page.locator("[data-testid='programme-472-handoffs'] button").first();

    await programme.waitFor();
    await table.waitFor();
    await expectAttribute(programme, "data-scorecard-state", "exact");
    await expectAttribute(programme, "data-authoritative-scorecard-state", "exact");
    await expectAttribute(programme, "data-deferred-scope-state", "permitted_explicit");
    await expectAttribute(programme, "data-summary-correction-state", "corrected");
    await expectAttribute(programme, "data-no-raw-artifact-urls", "true");
    await expectAttribute(deferred, "data-deferred-scope-state", "permitted_explicit");
    assert.equal(
      await table.locator("tbody tr[data-row-kind='phase']").count(),
      9,
      "Expected nine mandatory phase rows.",
    );
    assert.equal(
      await table.locator("tbody tr[data-row-kind='phase_deferred_scope']").count(),
      1,
      "Expected one explicit deferred Phase 7 row.",
    );
    assert(
      (await table.locator("tbody tr[data-row-kind='control_family']").count()) >= 14,
      "Expected cross-phase control family rows.",
    );
    assert(
      (await table.locator("tbody tr[data-row-state='exact']").count()) >= 25,
      "Expected exact mandatory rows.",
    );
    assert.equal(
      await table.locator("tbody tr[data-row-code='phase_7']").getAttribute("data-row-state"),
      "deferred_scope",
    );
    assert.equal(
      await corrections.locator("[data-original-claim-state='blocked']").count(),
      3,
      "Summary drift corrections should expose blocked original claims.",
    );
    await expectAttribute(sourceTrace, "data-drawer-state", "open");
    await expectAttribute(handoff, "data-artifact-presentation-contract", "required");
    await expectAttribute(handoff, "data-outbound-navigation-grant", "required");
    await expectAttribute(handoff, "data-raw-artifact-url-suppressed", "true");

    const phase7Button = page.locator(
      "[data-testid='programme-472-select-row-phase_7_deferred_nhs_app_channel_scope']",
    );
    await phase7Button.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(
      programme,
      "data-selected-row-ref",
      "phase_7_deferred_nhs_app_channel_scope",
    );
    assert(
      (
        await page
          .locator("[data-testid='programme-472-handoffs'] button")
          .first()
          .getAttribute("data-safe-return-token")
      )?.includes("phase_7_deferred_nhs_app_channel_scope"),
      "Safe handoff token should preserve the selected Phase 7 row.",
    );
    assert(
      (
        await page
          .locator("[data-testid='programme-472-handoffs'] button")
          .first()
          .getAttribute("data-route")
      )?.includes("selectedProgrammeRow=phase_7_deferred_nhs_app_channel_scope"),
      "Handoff route should preserve selected row.",
    );
    assertNoSensitiveSerialized(
      await programme.evaluate((node: HTMLElement) => node.innerText),
      "exact programme scorecard",
    );
    await writeProgrammeAriaSnapshot(page, "472-exact.aria.txt");
    await captureProgrammeScreenshot(page, "472-exact-scorecard.png");

    await page.goto(`${APP_URL}/ops/conformance?programme=472&programmeState=blocked`, {
      waitUntil: "networkidle",
    });
    await programme.waitFor();
    await expectAttribute(programme, "data-scorecard-state", "blocked");
    await expectAttribute(programme, "data-bau-handoff-state", "blocked");
    assert(
      Number(await corrections.getAttribute("data-blocked-claim-count")) >= 3,
      "Blocked scenario should expose blockers.",
    );
    await writeProgrammeAriaSnapshot(page, "472-blocked.aria.txt");
    await captureProgrammeScreenshot(page, "472-blocked-scorecard.png");

    await page.goto(`${APP_URL}/ops/conformance?programme=472&programmeState=deferred_scope`, {
      waitUntil: "networkidle",
    });
    await programme.waitFor();
    await expectAttribute(programme, "data-scorecard-state", "exact");
    await expectAttribute(programme, "data-deferred-scope-state", "permitted_explicit");
    await expectAttribute(
      programme,
      "data-selected-row-ref",
      "phase_7_deferred_nhs_app_channel_scope",
    );
    await writeProgrammeAriaSnapshot(page, "472-deferred-scope.aria.txt");
    await captureProgrammeScreenshot(page, "472-deferred-scope.png");

    await page.goto(`${APP_URL}/ops/conformance?programme=472&programmeState=summary_drift`, {
      waitUntil: "networkidle",
    });
    await programme.waitFor();
    await expectAttribute(programme, "data-scorecard-state", "blocked");
    await expectAttribute(
      programme,
      "data-summary-correction-state",
      "blocked_original_claim_visible",
    );
    await expectAttribute(programme, "data-summary-alignment-state", "blocked");
    await writeProgrammeAriaSnapshot(page, "472-summary-drift.aria.txt");
    await captureProgrammeScreenshot(page, "472-summary-drift.png");

    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
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
