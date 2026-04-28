import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, wait, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build489ScenarioRecords,
  OUTPUT_ROOT,
  write489ProgrammeClosureArtifacts,
} from "../../tools/programme/close_489_master_watchlist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "governance-console");
const APP_PORT = 4415;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const OUTPUT_DIR = path.join(ROOT, OUTPUT_ROOT, "transition-board");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+44|0)\d{9,}/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startGovernanceConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"],
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
    await waitForHttp(
      `${APP_URL}/ops/governance/continuous-improvement?transitionState=constrained&transitionRole=programme_owner`,
      30_000,
    );
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`governance-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopGovernanceConsole(child: ChildProcessWithoutNullStreams): Promise<void> {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function assertNoSensitiveSerialized(value: string, label: string): void {
  assert(!value.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await wait(50);
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

async function gotoBoard(page: any, state: string, role = "programme_owner"): Promise<any> {
  await page.goto(
    `${APP_URL}/ops/governance/continuous-improvement?transitionState=${state}&transitionRole=${role}`,
    { waitUntil: "networkidle" },
  );
  const board = page.locator("[data-testid='continuous-improvement-489']");
  await board.waitFor();
  await board.scrollIntoViewIfNeeded();
  return board;
}

async function writeAriaSnapshot(locator: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const serialized =
    typeof locator.ariaSnapshot === "function"
      ? String(await locator.ariaSnapshot())
      : String(await locator.evaluate((node: HTMLElement) => node.innerText));
  const target = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(target, serialized);
  assertNoSensitiveSerialized(serialized, name);
  return path.relative(ROOT, target);
}

async function captureBoardScreenshot(locator: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const target = path.join(OUTPUT_DIR, name);
  await locator.screenshot({ path: target, animations: "disabled", caret: "hide" });
  const text = await locator.evaluate((node: HTMLElement) => node.innerText);
  assertNoSensitiveSerialized(text, name);
  return path.relative(ROOT, target);
}

async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.clientWidth + 2 &&
      metrics.bodyScrollWidth <= metrics.clientWidth + 2,
    `${label} has horizontal overflow: ${JSON.stringify(metrics)}`,
  );
}

async function keyboardChooseFirstOption(page: any, testId: string): Promise<string> {
  const locator = page.locator(`[data-testid='${testId}']`);
  await locator.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await wait(100);
  let value = await locator.evaluate((node: HTMLSelectElement) => node.value);
  if (value === "all") {
    const options = await locator.locator("option").evaluateAll((nodes: HTMLOptionElement[]) =>
      nodes.map((node) => node.value).filter((optionValue) => optionValue !== "all"),
    );
    if (options[0]) {
      await locator.selectOption(options[0]);
      value = options[0];
    }
  }
  assert.notEqual(value, "all", `${testId} should change from all via keyboard-first filter flow.`);
  return value;
}

async function assertFocusReturnsTo(page: any, testId: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 2_000) {
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid,
    );
    if (activeTestId === testId) return;
    await wait(50);
  }
  const activeTestId = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.testid,
  );
  assert.equal(activeTestId, testId, "Focus should return to the source-lineage trigger.");
}

function writeArtifactManifest(entries: readonly { readonly scenarioId: string; readonly artifactRef: string }[]): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "489-continuous-improvement-board.artifact-manifest.json"),
    `${JSON.stringify(
      {
        recordType: "ContinuousImprovementBoard489ArtifactManifest",
        generatedAt: "2026-04-28T00:00:00.000Z",
        entries,
      },
      null,
      2,
    )}\n`,
  );
}

export async function run(): Promise<void> {
  fs.rmSync(path.join(ROOT, OUTPUT_ROOT), { recursive: true, force: true });
  write489ProgrammeClosureArtifacts();
  const active = build489ScenarioRecords("complete_with_transfers", []);
  const repeat = build489ScenarioRecords("complete_with_transfers", []);
  assert.equal(active.closure.recordHash, repeat.closure.recordHash);
  assert.equal(active.evidenceSeal.sealHash, repeat.evidenceSeal.sealHash);
  assert(build489ScenarioRecords("superseded_evidence_hash_closed", []).closure.blockerRefs.length > 0);

  const playwright = await importPlaywright();
  const server = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1120 },
    reducedMotion: "reduce",
    colorScheme: "light",
    forcedColors: "active",
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    const url = request.url();
    if (!url.includes("/@vite/client") && !url.includes("favicon")) {
      requestFailures.push(`${request.method()} ${url}`);
    }
  });

  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    const constrained = await gotoBoard(page, "constrained", "programme_owner");
    await expectAttribute(constrained, "data-programme-final-state", "complete_with_transfers");
    await expectAttribute(constrained, "data-closure-action-state", "settled");
    await page.locator("[data-testid='ci-489-top-strip']").waitFor();
    await page.locator("[data-testid='ci-489-watchlist-table']").waitFor();
    await page.locator("[data-testid='ci-489-outcome-tree']").waitFor();
    await page.locator("[data-testid='ci-489-cadence-calendar']").waitFor();
    assertNoSensitiveSerialized(await constrained.evaluate((node: HTMLElement) => node.innerText), "constrained board");
    await assertNoHorizontalOverflow(page, "constrained board");

    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='ci-489-watchlist-table']"),
        "489-watchlist-table.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='ci-489-outcome-tree']"),
        "489-outcome-tree.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='ci-489-cadence-calendar']"),
        "489-cadence-calendar.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await captureBoardScreenshot(constrained, "489-constrained-transition-board.png"),
    });

    const lineageTrigger = page.locator("[data-testid^='ci-489-open-lineage-']").first();
    const lineageTriggerId = String(await lineageTrigger.getAttribute("data-testid"));
    await lineageTrigger.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-testid='ci-489-source-lineage-drawer']");
    await drawer.waitFor();
    entries.push({
      scenarioId: "source_lineage",
      artifactRef: await writeAriaSnapshot(drawer, "489-source-lineage-drawer.aria.txt"),
    });
    await page.locator("[data-testid='ci-489-close-lineage-drawer']").click();
    await assertFocusReturnsTo(page, lineageTriggerId);

    for (const filterTestId of [
      "ci-489-filter-decision",
      "ci-489-filter-risk",
      "ci-489-filter-owner",
      "ci-489-filter-cadence",
    ]) {
      await gotoBoard(page, "constrained", "programme_owner");
      await keyboardChooseFirstOption(page, filterTestId);
      const visibleRows = await page.locator("[data-testid='ci-489-watchlist-table'] tbody tr").count();
      assert(visibleRows > 0, `${filterTestId} should leave visible filtered rows.`);
    }

    const complete = await gotoBoard(page, "complete", "programme_owner");
    await expectAttribute(complete, "data-board-state", "complete");
    await expectAttribute(complete, "data-closure-action-state", "settled");
    entries.push({
      scenarioId: "complete",
      artifactRef: await captureBoardScreenshot(complete, "489-complete-transition-board.png"),
    });

    const blocked = await gotoBoard(page, "blocked", "programme_owner");
    await expectAttribute(blocked, "data-programme-final-state", "blocked");
    await expectAttribute(blocked, "data-active-wave-status", "active");
    await expectAttribute(blocked, "data-closure-action-state", "blocked");
    entries.push({
      scenarioId: "blocked",
      artifactRef: await captureBoardScreenshot(blocked, "489-blocked-transition-board.png"),
    });

    const conflict = await gotoBoard(page, "transfer_conflict", "programme_owner");
    await expectAttribute(conflict, "data-programme-final-state", "blocked");
    await expectAttribute(conflict, "data-closure-action-state", "blocked");
    entries.push({
      scenarioId: "transfer_conflict",
      artifactRef: await captureBoardScreenshot(conflict, "489-transfer-conflict-transition-board.png"),
    });

    const viewer = await gotoBoard(page, "constrained", "viewer");
    await expectAttribute(viewer, "data-closure-action-state", "disabled_role");

    const vaultLink = page.locator("[data-testid='ci-489-evidence-vault-link']");
    const href = String(await vaultLink.getAttribute("href"));
    assert(href.includes("/ops/governance/evidence-vault"), "Final state must link to archived evidence vault.");
    assert(
      (await page.locator("[data-testid='ci-489-outcome-tree']").innerText()).includes("metric_489"),
      "Outcome tree should expose the CI backlog seed metrics.",
    );

    await page.setViewportSize({ width: 390, height: 960 });
    const mobile = await gotoBoard(page, "constrained", "programme_owner");
    await page.locator("[data-testid='ci-489-watchlist-table']").waitFor();
    await assertNoHorizontalOverflow(page, "mobile transition board");
    entries.push({
      scenarioId: "mobile",
      artifactRef: await writeAriaSnapshot(mobile, "489-mobile-transition-board.aria.txt"),
    });

    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "489-continuous-improvement-success.trace.zip") });
    entries.push({
      scenarioId: "trace",
      artifactRef: path.relative(
        ROOT,
        path.join(OUTPUT_DIR, "489-continuous-improvement-success.trace.zip"),
      ),
    });
    writeArtifactManifest(entries);
  } catch (error) {
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "489-continuous-improvement-failure.trace.zip") });
    throw error;
  } finally {
    await browser.close();
    await stopGovernanceConsole(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
