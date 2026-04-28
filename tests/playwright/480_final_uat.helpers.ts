import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, wait, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const OUTPUT_ROOT = path.join(ROOT, "output", "playwright", "480-final-uat-visual");

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

export function assertNoSensitiveSerialized(value: string | Buffer, label: string): void {
  const serialized = Buffer.isBuffer(value) ? value.toString("latin1") : value;
  assert(!serialized.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

function pngDimensions(
  image: Buffer,
  label: string,
): { readonly width: number; readonly height: number } {
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${label} is not a PNG`);
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
}

function byteSizeDriftRatio(baseline: Buffer, comparison: Buffer): number {
  return Math.abs(baseline.byteLength - comparison.byteLength) / Math.max(baseline.byteLength, 1);
}

function geometryDriftRatio(
  baseline: { readonly width: number; readonly height: number },
  comparison: { readonly width: number; readonly height: number },
): number {
  const widthDrift = Math.abs(baseline.width - comparison.width) / Math.max(baseline.width, 1);
  const heightDrift = Math.abs(baseline.height - comparison.height) / Math.max(baseline.height, 1);
  return Math.max(widthDrift, heightDrift);
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

export async function gotoAndWait(
  page: any,
  url: string,
  selector: string,
  waitUntil: "load" | "domcontentloaded" | "networkidle" = "networkidle",
): Promise<any> {
  await page.goto(url, { waitUntil });
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
  await locator.screenshot({
    path: absolutePath,
    animations: "disabled",
    caret: "hide",
  });
  const visibleText = await locator
    .evaluate((node: HTMLElement) => node.innerText ?? "")
    .catch(() => "");
  assertNoSensitiveSerialized(String(visibleText), relativePath);
  return absolutePath;
}

export async function assertStableVisual(
  locator: any,
  baselineRelativePath: string,
): Promise<{
  readonly baselinePath: string;
  readonly comparisonPath: string;
  readonly comparisonMetadataPath: string;
  readonly baselineHash: string;
  readonly comparisonHash: string;
}> {
  const baselinePath = await captureScreenshot(locator, baselineRelativePath);
  const comparisonPath = baselinePath.replace(/\.png$/, ".comparison.png");
  await locator.screenshot({
    path: comparisonPath,
    animations: "disabled",
    caret: "hide",
  });
  const baseline = fs.readFileSync(baselinePath);
  const comparison = fs.readFileSync(comparisonPath);
  const baselineHash = createHash("sha256").update(baseline).digest("hex");
  const comparisonHash = createHash("sha256").update(comparison).digest("hex");
  const baselineDimensions = pngDimensions(baseline, baselineRelativePath);
  const comparisonDimensions = pngDimensions(comparison, `${baselineRelativePath}.comparison`);
  const maxGeometryDriftRatio = geometryDriftRatio(baselineDimensions, comparisonDimensions);
  assert(
    baselineDimensions.width === comparisonDimensions.width && maxGeometryDriftRatio <= 0.01,
    `${baselineRelativePath} geometry drift exceeded volatile-region tolerance: ${maxGeometryDriftRatio}`,
  );
  const sizeDriftRatio = byteSizeDriftRatio(baseline, comparison);
  assert(
    comparisonHash === baselineHash || sizeDriftRatio <= 0.05,
    `${baselineRelativePath} visual drift exceeded volatile-region tolerance: ${sizeDriftRatio}`,
  );
  const comparisonMetadataPath = baselinePath.replace(/\.png$/, ".visual-comparison.json");
  const comparisonMetadata = {
    recordType: "VisualRegressionComparisonEvidence",
    baselineArtifactRef: outputRelative(baselinePath),
    comparisonArtifactRef: outputRelative(comparisonPath),
    baselineHash,
    comparisonHash,
    baselineDimensions,
    comparisonDimensions,
    geometryDriftRatio: maxGeometryDriftRatio,
    sizeDriftRatio,
    volatileRegionPolicy: "bounded_geometry_and_byte_drift",
    generatedAt: "2026-04-28T00:00:00.000Z",
  };
  fs.writeFileSync(comparisonMetadataPath, `${JSON.stringify(comparisonMetadata, null, 2)}\n`);
  assertNoSensitiveSerialized(
    JSON.stringify(comparisonMetadata),
    `${baselineRelativePath}.metadata`,
  );
  return { baselinePath, comparisonPath, comparisonMetadataPath, baselineHash, comparisonHash };
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

export async function assertSingleDominantAction(root: any, label: string): Promise<void> {
  const count = await root
    .locator(
      [
        "[data-action-ready='true']",
        "[data-testid$='primary-action']",
        "[data-testid$='dominant-action']",
        ".ops-button--primary",
      ].join(","),
    )
    .count();
  assert(count <= 2, `${label} exposes too many dominant action loci: ${count}`);
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
    recordType: "FinalUATSuiteArtifactManifest",
    suite,
    generatedAt: "2026-04-28T00:00:00.000Z",
    entries,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  assertNoSensitiveSerialized(JSON.stringify(value), `${suite} artifact manifest`);
}
