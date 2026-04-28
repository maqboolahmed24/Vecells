import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build474CutoverArtifacts,
  write474CutoverArtifacts,
} from "../../tools/migration/plan_474_cutover";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4349";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "474-migration-cutover");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|https?:\/\//i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4349", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/conformance?cutoverState=dry_run`, 25_000);
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

async function captureCutoverScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='migration-474-cutover-board']").screenshot({
    path: screenshotPath,
  });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

export async function run(): Promise<void> {
  write474CutoverArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const apiStaleScenario = build474CutoverArtifacts("blocked");
  assert.equal(
    apiStaleScenario.projectionBackfillPlan.cutoverReadinessState,
    "blocked",
    "API-side stale projection verdict should block cutover.",
  );
  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1240 },
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
    await page.goto(`${APP_URL}/ops/conformance?cutoverState=dry_run`, {
      waitUntil: "networkidle",
    });
    const board = page.locator("[data-testid='migration-474-cutover-board']");
    const topStrip = page.locator("[data-testid='migration-474-top-strip']");
    const ladder = page.locator("[data-testid='migration-474-cutover-ladder']");
    const heatstrip = page.locator("[data-testid='migration-474-heatstrip']");
    const rollback = page.locator("[data-testid='migration-474-rollback-matrix']");
    const reference = page.locator("[data-testid='migration-474-reference-manifest']");
    const rightRail = page.locator("[data-testid='migration-474-right-rail']");
    const approveDryRun = page.locator("[data-testid='migration-474-approve-dry-run']");
    const executeCutover = page.locator("[data-testid='migration-474-execute-cutover']");
    await board.waitFor();
    await expectAttribute(board, "data-cutover-decision", "ready_with_constraints");
    await expectAttribute(board, "data-dry-run-action-state", "enabled");
    await expectAttribute(board, "data-destructive-action-state", "disabled_until_authority_exact");
    await expectAttribute(board, "data-no-raw-artifact-urls", "true");
    assert(!(await approveDryRun.isDisabled()), "Dry-run approval should be enabled.");
    assert(await executeCutover.isDisabled(), "Production cutover must stay disabled.");
    await topStrip.waitFor();
    await writeAriaSnapshot(ladder, "474-dry-run-ladder.aria.txt");
    await writeAriaSnapshot(heatstrip, "474-dry-run-heatstrip.aria.txt");
    await writeAriaSnapshot(rollback, "474-dry-run-rollback.aria.txt");
    await writeAriaSnapshot(reference, "474-dry-run-reference.aria.txt");
    await captureCutoverScreenshot(page, "474-dry-run-cutover.png");

    await page
      .locator("[data-testid='migration-474-heatstrip-row-pharmacy_console'] button")
      .focus();
    await page.keyboard.press("Enter");
    await expectAttribute(board, "data-selected-projection-family", "pharmacy_console");
    await page.keyboard.press("Tab");
    const activeText = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent ?? "",
    );
    assert(activeText.length > 0, "Keyboard navigation should land on a named control.");

    await page.goto(`${APP_URL}/ops/conformance?cutoverState=ready_with_constraints`, {
      waitUntil: "networkidle",
    });
    await board.waitFor();
    await expectAttribute(board, "data-cutover-decision", "ready_with_constraints");
    await expectAttribute(
      page.locator("[data-testid='migration-474-heatstrip-row-staff_workspace']"),
      "data-convergence-state",
      "exact",
    );
    await expectAttribute(
      page.locator("[data-testid='migration-474-heatstrip-row-pharmacy_console']"),
      "data-convergence-state",
      "stale",
    );
    assert(await executeCutover.isDisabled(), "Stale pharmacy projection blocks cutover.");

    await page.goto(`${APP_URL}/ops/conformance?cutoverState=blocked`, {
      waitUntil: "networkidle",
    });
    await board.waitFor();
    await expectAttribute(board, "data-cutover-decision", "blocked");
    await expectAttribute(board, "data-dry-run-action-state", "blocked");
    await expectAttribute(board, "data-destructive-action-state", "disabled_blocked");
    assert(await approveDryRun.isDisabled(), "Blocked scenario should disable dry-run approval.");
    assert(await executeCutover.isDisabled(), "Blocked scenario must disable execution.");
    await expectAttribute(
      page.locator("[data-testid='migration-474-heatstrip-row-pharmacy_console']"),
      "data-convergence-state",
      "blocked",
    );
    await captureCutoverScreenshot(page, "474-blocked-cutover.png");

    await page.goto(`${APP_URL}/ops/conformance?cutoverState=rollback_only`, {
      waitUntil: "networkidle",
    });
    await board.waitFor();
    await expectAttribute(board, "data-cutover-decision", "rollback_only");
    await expectAttribute(board, "data-destructive-action-state", "disabled_rollback_only");
    await expectAttribute(
      page.locator("[data-testid='migration-474-rollback-pharmacy_console']"),
      "data-decision-state",
      "rollback_only",
    );
    assert(await executeCutover.isDisabled(), "Rollback-only scenario must disable execution.");

    await page.goto(`${APP_URL}/ops/conformance?cutoverState=poison_record`, {
      waitUntil: "networkidle",
    });
    await board.waitFor();
    await expectAttribute(board, "data-cutover-decision", "ready_with_constraints");
    await expectAttribute(
      page.locator("[data-testid='migration-474-poison-pbr_474_pharmacy_unknown_supplier']"),
      "data-tenant-wide-block",
      "false",
    );
    await expectAttribute(
      page.locator("[data-testid='migration-474-poison-pbr_474_pharmacy_unknown_supplier']"),
      "data-safe-to-continue",
      "true",
    );
    await writeAriaSnapshot(rightRail, "474-poison-right-rail.aria.txt");

    await page.setViewportSize({ width: 390, height: 980 });
    await page.goto(`${APP_URL}/ops/conformance?cutoverState=dry_run`, {
      waitUntil: "networkidle",
    });
    await board.waitFor();
    await expectAttribute(board, "data-responsive-contract", "cutover_board_tables_preserved");
    assert(await ladder.isVisible(), "Narrow layout must keep the ladder visible.");
    assert(await heatstrip.isVisible(), "Narrow layout must keep the heatstrip table visible.");
    assert(await reference.isVisible(), "Narrow layout must keep the reference manifest visible.");
    await writeAriaSnapshot(board, "474-mobile-dry-run-board.aria.txt");

    assertNoSensitiveSerialized(
      await board.evaluate((node: HTMLElement) => node.innerText),
      "migration cutover board",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "474-migration-cutover-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "474-migration-cutover-failure-trace.zip"),
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
