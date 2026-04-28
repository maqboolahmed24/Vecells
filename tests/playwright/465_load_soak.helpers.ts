import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildQueueHeatmapProjection,
  runPhase9LoadSoakSuite,
} from "../performance/465_phase9_load_soak_scenarios";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const OPS_APP_DIR = path.join(ROOT, "apps", "ops-console");
export const OPS_APP_URL = "http://127.0.0.1:4335";
export const OUTPUT_DIR = path.join(ROOT, ".artifacts", "load-soak-breach-heatmap-465");

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4335", "--strictPort"],
    {
      cwd: OPS_APP_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${OPS_APP_URL}/ops/queues`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopServer(child: ChildProcessWithoutNullStreams): Promise<void> {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

export async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

export async function writeAccessibilitySnapshot(page: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (page.accessibility?.snapshot) {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
    const serialized = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
    return serialized;
  }
  const locatorSnapshot =
    typeof page.locator("body").ariaSnapshot === "function"
      ? await page.locator("body").ariaSnapshot()
      : await page.locator("body").evaluate((body: HTMLElement) => body.innerText);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), String(locatorSnapshot));
  return String(locatorSnapshot);
}

export async function assertNoSensitiveText(locator: any, label: string): Promise<void> {
  const serialized = String(await locator.evaluate((node: HTMLElement) => node.textContent ?? ""));
  assert(
    !serialized.match(/rawDomainEventRef|rawPayload|clinicalNarrative|patientNhs|nhsNumber/i),
    `${label} exposed raw patient or event material`,
  );
  assert(
    !serialized.match(/Bearer|access_token|sk_live|BEGIN PRIVATE|rawWebhookUrl/i),
    `${label} exposed secret material`,
  );
}

export async function withLoadSoakOpsBrowser(
  callback: (page: any, context: any, browser: any) => Promise<void>,
  options: { viewport?: { width: number; height: number }; reducedMotion?: boolean } = {},
): Promise<void> {
  const playwright = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1440, height: 1120 },
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
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
    requestFailures.push(`${request.method()} ${request.url()}`);
  });
  try {
    await callback(page, context, browser);
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "load-soak-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "load-soak-failure-trace.zip"),
    });
    throw error;
  } finally {
    await browser.close();
    await stopServer(server.child);
  }
}

export function loadExpectedHeatmap() {
  const expectedPath = path.join(
    ROOT,
    "tests",
    "performance",
    "465_queue_heatmap_expected_outcomes.json",
  );
  return fs.existsSync(expectedPath)
    ? JSON.parse(fs.readFileSync(expectedPath, "utf8"))
    : buildQueueHeatmapProjection();
}

export function loadExpectedEvidence() {
  const expectedPath = path.join(
    ROOT,
    "data",
    "evidence",
    "465_load_soak_breach_queue_heatmap_results.json",
  );
  return fs.existsSync(expectedPath)
    ? JSON.parse(fs.readFileSync(expectedPath, "utf8"))
    : runPhase9LoadSoakSuite();
}
