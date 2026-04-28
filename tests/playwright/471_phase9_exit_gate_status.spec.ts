import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import { writePhase9ExitGateArtifacts } from "../../tools/assurance/run_471_phase9_exit_gate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4343";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "471-phase9-exit-gate");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawIncidentDetail|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|secretRef|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4343", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/conformance`, 25_000);
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

async function writeAccessibilitySnapshot(page: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const body = page.locator("body");
  const serialized =
    typeof body.ariaSnapshot === "function"
      ? String(await body.ariaSnapshot())
      : String(await body.evaluate((node: HTMLElement) => node.innerText));
  fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
  assertNoSensitiveSerialized(serialized, name);
  return serialized;
}

function assertNoTracePersistence(): void {
  const traceFiles = fs.existsSync(OUTPUT_DIR)
    ? fs
        .readdirSync(OUTPUT_DIR, { recursive: true })
        .map(String)
        .filter((name) => name.endsWith(".zip") || name.endsWith(".trace"))
    : [];
  assert.deepEqual(traceFiles, [], `Unexpected persisted trace files: ${traceFiles.join(", ")}`);
}

export async function run(): Promise<void> {
  writePhase9ExitGateArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1120 },
    reducedMotion: "no-preference",
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
    await page.goto(`${APP_URL}/ops/conformance?state=exact&exitGate=exact`, {
      waitUntil: "networkidle",
    });
    const shell = page.locator("[data-testid='conformance-scorecard-shell']");
    const status = page.locator("[data-testid='phase9-exit-gate-status']");
    await status.waitFor();
    await shell.waitFor();
    await expectAttribute(status, "data-decision-state", "approved");
    await expectAttribute(status, "data-approval-control-state", "enabled");
    await expectAttribute(status, "data-release-to-bau-guard-state", "permitted");
    await expectAttribute(status, "data-no-raw-artifact-urls", "true");
    const exactRows = await status.locator("[data-row-state='exact'][data-mandatory='true']").count();
    assert(exactRows >= 15, "Exact status should render mandatory exact rows.");
    await expectAttribute(
      page.locator("[data-testid='phase9-exit-gate-handoffs'] button").first(),
      "data-artifact-presentation-contract",
      "required",
    );
    await expectAttribute(
      page.locator("[data-testid='phase9-exit-gate-handoffs'] button").first(),
      "data-outbound-navigation-grant",
      "required",
    );
    const exactBody = await page.locator("body").evaluate((body: HTMLElement) => body.textContent ?? "");
    assertNoSensitiveSerialized(exactBody, "exact exit-gate body");
    await writeAccessibilitySnapshot(page, "471-exact.aria.txt");
    const exactScreenshot = path.join(OUTPUT_DIR, "471-exact-exit-gate.png");
    await page.screenshot({ path: exactScreenshot, fullPage: true });
    assertNoSensitiveSerialized(fs.readFileSync(exactScreenshot), "exact exit-gate screenshot");

    await page.goto(`${APP_URL}/ops/conformance?state=exact&exitGate=blocked`, {
      waitUntil: "networkidle",
    });
    await status.waitFor();
    await expectAttribute(status, "data-decision-state", "blocked");
    await expectAttribute(status, "data-approval-control-state", "disabled");
    await expectAttribute(status, "data-release-to-bau-guard-state", "blocked");
    assert(
      await page.locator("[data-testid='phase9-exit-gate-approval-action']").isDisabled(),
      "Blocked exit-gate approval control must be disabled.",
    );
    assert(
      (await page.locator("[data-testid='phase9-exit-gate-blockers']").getAttribute("data-blocker-count")) !==
        "0",
      "Blocked exit-gate view must expose blockers.",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeText = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.innerText ?? "",
    );
    assert(activeText.length > 0, "Keyboard focus should expose a named control or row.");
    await writeAccessibilitySnapshot(page, "471-blocked.aria.txt");
    const blockedScreenshot = path.join(OUTPUT_DIR, "471-blocked-exit-gate.png");
    await page.screenshot({ path: blockedScreenshot, fullPage: true });
    assertNoSensitiveSerialized(fs.readFileSync(blockedScreenshot), "blocked exit-gate screenshot");

    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    assertNoTracePersistence();
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
