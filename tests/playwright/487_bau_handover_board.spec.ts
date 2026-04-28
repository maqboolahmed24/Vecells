import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, wait, waitForHttp } from "./simulator-backplane-test-helpers.js";
import { OUTPUT_ROOT, write487BAUHandoverArtifacts } from "../../tools/bau/complete_487_bau_handover";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_PORT = 4413;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const OUTPUT_DIR = path.join(ROOT, OUTPUT_ROOT, "bau-handover-board");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+44|0)\d{9,}/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
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
    await waitForHttp(`${APP_URL}/ops/bau/handover?handoverState=constrained`, 30_000);
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

async function gotoBoard(page: any, state: string, role = "service_owner"): Promise<any> {
  await page.goto(`${APP_URL}/ops/bau/handover?handoverState=${state}&handoverRole=${role}`, {
    waitUntil: "networkidle",
  });
  const board = page.locator("[data-testid='bau-487-board']");
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

function writeArtifactManifest(entries: readonly { readonly scenarioId: string; readonly artifactRef: string }[]): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "487-bau-handover-board.artifact-manifest.json"),
    `${JSON.stringify(
      {
        recordType: "BAUHandoverBoard487ArtifactManifest",
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
  write487BAUHandoverArtifacts();
  const playwright = await importPlaywright();
  const server = await startOpsConsole();
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
    const constrained = await gotoBoard(page, "constrained", "service_owner");
    await expectAttribute(constrained, "data-handover-verdict", "accepted_with_constraints");
    await expectAttribute(constrained, "data-acceptance-action-state", "enabled");
    await page.locator("[data-testid='bau-487-responsibility-lanes']").waitFor();
    await page.locator("[data-testid='bau-487-rota-table']").waitFor();
    await page.locator("[data-testid='bau-487-open-actions']").waitFor();
    await page.locator("[data-testid='bau-487-right-rail']").waitFor();
    assert(!(await page.locator("[data-testid='bau-487-accept-handover']").isDisabled()));
    assertNoSensitiveSerialized(await constrained.evaluate((node: HTMLElement) => node.innerText), "constrained board");
    await assertNoHorizontalOverflow(page, "constrained board");

    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='bau-487-responsibility-lanes']"),
        "487-responsibility-lanes.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='bau-487-rota-table']"),
        "487-rota-table.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='bau-487-open-actions']"),
        "487-open-actions.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "constrained",
      artifactRef: await captureBoardScreenshot(constrained, "487-constrained-bau-handover.png"),
    });

    const clinicalCard = page.locator("[data-testid='bau-487-domain-card-clinical_safety']");
    await clinicalCard.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-testid='bau-487-source-drawer']");
    await drawer.waitFor();
    entries.push({
      scenarioId: "source_drawer",
      artifactRef: await writeAriaSnapshot(drawer, "487-source-drawer.aria.txt"),
    });
    await page.locator("[data-testid='bau-487-close-source-drawer']").click();
    assert.equal(
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid),
      "bau-487-domain-card-clinical_safety",
      "Focus should return to the reviewed owner/deputy card after closing source drawer.",
    );

    await page.locator("[data-testid='bau-487-accept-handover']").click();
    const dialog = page.locator("[data-testid='bau-487-acceptance-dialog']");
    await dialog.waitFor();
    entries.push({
      scenarioId: "acceptance_dialog",
      artifactRef: await writeAriaSnapshot(dialog, "487-acceptance-dialog.aria.txt"),
    });

    const accepted = await gotoBoard(page, "accepted", "service_owner");
    await expectAttribute(accepted, "data-handover-verdict", "accepted");
    entries.push({
      scenarioId: "accepted",
      artifactRef: await captureBoardScreenshot(accepted, "487-accepted-bau-handover.png"),
    });

    const blocked = await gotoBoard(page, "blocked", "service_owner");
    await expectAttribute(blocked, "data-handover-verdict", "blocked");
    await expectAttribute(blocked, "data-acceptance-action-state", "disabled_blocked");
    assert(await page.locator("[data-testid='bau-487-accept-handover']").isDisabled());
    entries.push({
      scenarioId: "blocked",
      artifactRef: await captureBoardScreenshot(blocked, "487-blocked-bau-handover.png"),
    });

    const oohGap = await gotoBoard(page, "ooh_gap", "service_owner");
    await expectAttribute(oohGap, "data-handover-verdict", "blocked");
    await expectAttribute(oohGap, "data-rota-coverage-state", "blocked");
    await expectAttribute(
      page.locator("[data-testid='bau-487-domain-card-incident_command']"),
      "data-coverage-state",
      "missing",
    );
    entries.push({
      scenarioId: "out_of_hours_gap",
      artifactRef: await captureBoardScreenshot(oohGap, "487-out-of-hours-gap-bau-handover.png"),
    });

    const viewer = await gotoBoard(page, "constrained", "viewer");
    await expectAttribute(viewer, "data-acceptance-action-state", "disabled_role");
    assert(await page.locator("[data-testid='bau-487-accept-handover']").isDisabled());

    const rotaManager = await gotoBoard(page, "constrained", "rota_manager");
    await expectAttribute(rotaManager, "data-rota-modify-action-state", "enabled");
    assert(!(await page.locator("[data-testid='bau-487-modify-rotas']").isDisabled()));

    await page.setViewportSize({ width: 390, height: 960 });
    const mobile = await gotoBoard(page, "constrained", "service_owner");
    await page.locator("[data-testid='bau-487-responsibility-lanes']").waitFor();
    await assertNoHorizontalOverflow(page, "mobile BAU handover");
    entries.push({
      scenarioId: "mobile",
      artifactRef: await writeAriaSnapshot(mobile, "487-mobile-bau-handover.aria.txt"),
    });

    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "487-bau-handover-success.trace.zip") });
    entries.push({
      scenarioId: "trace",
      artifactRef: path.relative(ROOT, path.join(OUTPUT_DIR, "487-bau-handover-success.trace.zip")),
    });
    writeArtifactManifest(entries);
  } catch (error) {
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "487-bau-handover-failure.trace.zip") });
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
