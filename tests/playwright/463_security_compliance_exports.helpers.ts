import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const GOVERNANCE_APP_DIR = path.join(ROOT, "apps", "governance-console");
export const OPS_APP_DIR = path.join(ROOT, "apps", "ops-console");
export const GOVERNANCE_APP_URL = "http://127.0.0.1:4331";
export const OPS_APP_URL = "http://127.0.0.1:4332";
export const OUTPUT_DIR = path.join(ROOT, ".artifacts", "security-compliance-exports-463");

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startViteApp(
  appDir: string,
  appName: string,
  port: number,
  probePath: string,
): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: appDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`http://127.0.0.1:${port}${probePath}`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`${appName} failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

export async function startSecurityComplianceExportApps() {
  const governance = await startViteApp(
    GOVERNANCE_APP_DIR,
    "governance-console",
    4331,
    "/ops/config/security-compliance-exports",
  );
  const ops = await startViteApp(OPS_APP_DIR, "ops-console", 4332, "/ops/assurance");
  return { governance, ops };
}

export async function stopServer(child: ChildProcessWithoutNullStreams) {
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

function assertNoSensitiveMaterial(serialized: string, label: string) {
  assert(!serialized.match(/https?:\/\//), `${label} must not include raw URLs`);
  assert(
    !serialized.match(/Bearer|access_token|sk_live|BEGIN PRIVATE|inlineSecret|clinicalNarrative/),
    `${label} must not include secrets or PHI narrative fields`,
  );
}

export function assertRedactedSecurityReportingPayload(payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  assertNoSensitiveMaterial(serialized, "security reporting payload");
  assert.equal(payload.schemaVersion, "463.phase9.fake-security-reporting-payload.v1");
  assert.equal(typeof payload.safeSummaryHash, "string");
  assert.equal(typeof payload.outboundNavigationGrantRef, "string");
}

export function assertRedactedComplianceExportPayload(payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  assertNoSensitiveMaterial(serialized, "compliance export payload");
  assert.equal(payload.schemaVersion, "463.phase9.fake-compliance-export-payload.v1");
  assert.equal(typeof payload.exportManifestHash, "string");
  assert.equal(typeof payload.reproductionHash, "string");
  assert.equal(payload.artifactPresentationContractRef, "ArtifactPresentationContract");
}

export async function withSecurityComplianceExportBrowser(
  callback: (page: any, context: any, browser: any) => Promise<void>,
  options: { viewport?: { width: number; height: number }; reducedMotion?: boolean } = {},
) {
  const playwright = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const apps = await startSecurityComplianceExportApps();
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
  } finally {
    await browser.close();
    await stopServer(apps.governance.child);
    await stopServer(apps.ops.child);
  }
}
