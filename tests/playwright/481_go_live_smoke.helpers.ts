import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, wait, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "../..");
export const OUTPUT_ROOT = path.join(ROOT, "output", "playwright", "481-dr-go-live-smoke");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export type StartedServer = {
  readonly appName: string;
  readonly baseUrl: string;
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

export type RuntimeGuards = {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly requestFailures: string[];
};

export async function loadPlaywright() {
  return importPlaywright();
}

export async function startViteApp(
  appName: string,
  port: number,
  healthPath = "/",
): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: path.join(ROOT, "apps", appName),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}${healthPath}`, 30_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`${appName} failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { appName, baseUrl, child, logs };
}

export async function stopServer(server: StartedServer): Promise<void> {
  server.child.kill("SIGTERM");
  await new Promise((resolve) => {
    server.child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

export function attachRuntimeGuards(page: any): RuntimeGuards {
  const guards: RuntimeGuards = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
  };
  page.on("console", (message: any) => {
    if (message.type() === "error") guards.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => guards.pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    const url = request.url();
    if (!url.includes("/@vite/client") && !url.includes("favicon")) {
      guards.requestFailures.push(`${request.method()} ${url}`);
    }
  });
  return guards;
}

export function assertCleanRuntime(guards: RuntimeGuards, label: string): void {
  assert.deepEqual(
    guards.consoleErrors,
    [],
    `${label} console errors: ${guards.consoleErrors.join("\n")}`,
  );
  assert.deepEqual(guards.pageErrors, [], `${label} page errors: ${guards.pageErrors.join("\n")}`);
  assert.deepEqual(
    guards.requestFailures,
    [],
    `${label} request failures: ${guards.requestFailures.join("\n")}`,
  );
}

export function assertNoSensitiveSerialized(value: string, label: string): void {
  assert(!value.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

export async function expectAttribute(
  locator: any,
  name: string,
  expected: string | readonly string[],
): Promise<void> {
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4_000) {
    const value = await locator.getAttribute(name);
    if (expectedValues.includes(String(value))) return;
    await wait(50);
  }
  const value = await locator.getAttribute(name);
  assert(
    expectedValues.includes(String(value)),
    `Expected ${name} in ${expectedValues.join(", ")}, found ${value}.`,
  );
}

export async function gotoAndWait(page: any, url: string, selector: string): Promise<any> {
  await page.goto(url, { waitUntil: "networkidle" });
  const locator = page.locator(selector).first();
  await locator.waitFor();
  await locator.scrollIntoViewIfNeeded();
  return locator;
}

export async function writeAriaSnapshot(locator: any, relativePath: string): Promise<string> {
  const absolutePath = path.join(OUTPUT_ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const serialized =
    typeof locator.ariaSnapshot === "function"
      ? String(await locator.ariaSnapshot())
      : String(await locator.evaluate((node: HTMLElement) => node.innerText));
  fs.writeFileSync(absolutePath, serialized);
  assertNoSensitiveSerialized(serialized, relativePath);
  return absolutePath;
}

export async function captureScreenshot(locator: any, relativePath: string): Promise<string> {
  const absolutePath = path.join(OUTPUT_ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  await locator.screenshot({ path: absolutePath, animations: "disabled", caret: "hide" });
  const visibleText = await locator
    .evaluate((node: HTMLElement) => node.innerText ?? "")
    .catch(() => "");
  assertNoSensitiveSerialized(String(visibleText), relativePath);
  return absolutePath;
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
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

export function outputRelative(absolutePath: string): string {
  return path.relative(ROOT, absolutePath);
}

export function writeSuiteArtifactManifest(
  suite: string,
  entries: readonly { readonly scenarioId: string; readonly artifactRef: string }[],
): void {
  const manifestPath = path.join(OUTPUT_ROOT, suite, `${suite}.artifact-manifest.json`);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const value = {
    recordType: "FinalDRSmokeSuiteArtifactManifest",
    suite,
    generatedAt: "2026-04-28T00:00:00.000Z",
    entries,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  assertNoSensitiveSerialized(JSON.stringify(value), `${suite} artifact manifest`);
}
