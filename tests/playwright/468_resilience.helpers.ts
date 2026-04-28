import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  buildPhase9RestoreFailoverChaosSliceQuarantineSuite,
  writePhase9RestoreFailoverChaosSliceQuarantineArtifacts,
} from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const OPS_APP_DIR = path.join(ROOT, "apps", "ops-console");
export const OPS_APP_URL = "http://127.0.0.1:4338";
export const OUTPUT_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "468-restore-failover-chaos-slice-quarantine",
);

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

const forbiddenSurfacePatterns =
  /rawObjectStoreUrl|rawBackupScope|rawPayload|clinicalNarrative|patientNhs|nhsNumber|Bearer |access_token|sk_live|BEGIN PRIVATE|s3:\/\/|gs:\/\/|blob:|secretRef|\bproduction\b|\bpreprod\b|\bstaging\b/i;

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4338", "--strictPort"],
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
    await waitForHttp(`${OPS_APP_URL}/ops/resilience`, 25_000);
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

export async function assertNoSensitiveText(locator: any, label: string): Promise<void> {
  const serialized = String(await locator.evaluate((node: HTMLElement) => node.textContent ?? ""));
  assert(!serialized.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

export function assertNoSensitiveSnapshot(snapshot: string, label: string): void {
  assert(!snapshot.match(forbiddenSurfacePatterns), `${label} exposed sensitive ARIA text`);
}

export async function writeAccessibilitySnapshot(
  page: any,
  name: string,
  locator: string = "body",
): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const target = page.locator(locator);
  if (typeof target.ariaSnapshot === "function") {
    const snapshot = await target.ariaSnapshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, name), String(snapshot));
    return String(snapshot);
  }
  if (page.accessibility?.snapshot) {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
    const serialized = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
    return serialized;
  }
  const fallback = await target.evaluate((node: HTMLElement) => node.innerText);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), String(fallback));
  return String(fallback);
}

export function load468Evidence() {
  const evidencePath = path.join(
    ROOT,
    "data",
    "evidence",
    "468_restore_failover_chaos_slice_quarantine_results.json",
  );
  if (!fs.existsSync(evidencePath)) {
    writePhase9RestoreFailoverChaosSliceQuarantineArtifacts();
  }
  return fs.existsSync(evidencePath)
    ? JSON.parse(fs.readFileSync(evidencePath, "utf8"))
    : buildPhase9RestoreFailoverChaosSliceQuarantineSuite().evidence;
}

export async function waitForResilienceSurfaces(page: any): Promise<void> {
  await page.locator("[data-testid='ops-shell-root']").waitFor();
  for (const surface of [
    "resilience-board",
    "essential-function-map",
    "operational-readiness-snapshot",
    "dependency-restore-bands",
    "recovery-control-posture",
    "backup-freshness",
    "runbook-binding",
    "recovery-run-timeline",
    "recovery-action-rail",
    "resilience-settlement",
    "recovery-artifact-stage",
  ]) {
    await page.locator(`[data-surface='${surface}']`).waitFor();
  }
}

export async function withResilienceBrowser(
  label: string,
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
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    const failureText = request.failure()?.errorText ?? "";
    if (!request.url().includes("/@vite/client")) {
      requestFailures.push(`${request.method()} ${request.url()} ${failureText}`);
    }
  });

  try {
    await callback(page, context, browser);
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests in ${label}: ${requestFailures.join("\n")}`,
    );
  } finally {
    await browser.close();
    await stopServer(server.child);
  }
}
