import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import { writePhase9FullRegressionAndDefensiveSecurityArtifacts } from "../../tools/testing/run_470_full_regression_and_defensive_security";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const OPS_APP_DIR = path.join(ROOT, "apps", "ops-console");
const GOVERNANCE_APP_DIR = path.join(ROOT, "apps", "governance-console");
const OPS_APP_URL = "http://127.0.0.1:4341";
const GOVERNANCE_APP_URL = "http://127.0.0.1:4342";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "470-full-cross-phase-regression");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawIncidentDetail|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|secretRef|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startViteServer(
  appDir: string,
  appUrl: string,
  port: string,
  pathToWaitFor: string,
  label: string,
): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", port, "--strictPort"],
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
    await waitForHttp(`${appUrl}${pathToWaitFor}`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`${label} failed to start.\n${logs.join("")}`, { cause: error });
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

async function assertNoSensitiveText(locator: any, label: string): Promise<void> {
  const serialized = String(await locator.evaluate((node: HTMLElement) => node.textContent ?? ""));
  assertNoSensitiveSerialized(serialized, label);
}

function assertNoSensitiveScreenshot(screenshotPath: string, label: string): void {
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), label);
}

async function writeAccessibilitySnapshot(page: any, name: string, locator = "body"): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const target = page.locator(locator);
  let serialized: string;
  if (typeof target.ariaSnapshot === "function") {
    serialized = String(await target.ariaSnapshot());
  } else if (page.accessibility?.snapshot) {
    serialized = JSON.stringify(await page.accessibility.snapshot({ interestingOnly: false }), null, 2);
  } else {
    serialized = String(await target.evaluate((node: HTMLElement) => node.innerText));
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
  assertNoSensitiveSerialized(serialized, name);
  return serialized;
}

function assertNoTracePersistence(): void {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  const traceFiles = fs
    .readdirSync(OUTPUT_DIR, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith(".zip") || name.endsWith(".trace"));
  assert.deepEqual(traceFiles, [], `Unexpected persisted trace files: ${traceFiles.join(", ")}`);
}

function attachRuntimeGuards(page: any, label: string) {
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

  return () => {
    assert.deepEqual(consoleErrors, [], `Unexpected console errors in ${label}: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors in ${label}: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests in ${label}: ${requestFailures.join("\n")}`,
    );
  };
}

async function waitForIncidentSurfaces(page: any): Promise<void> {
  await page.locator("[data-testid='ops-shell-root']").waitFor();
  for (const surface of [
    "incident-desk",
    "incident-command-strip",
    "incident-queue",
    "near-miss-intake",
    "severity-board",
    "containment-timeline",
    "reportability-checklist",
    "pir-panel",
    "incident-capa-links",
    "incident-evidence-links",
    "incident-telemetry-redaction",
  ]) {
    await page.locator(`[data-surface='${surface}']`).waitFor();
  }
}

async function waitForTenantSurfaces(page: any): Promise<void> {
  await page.locator("[data-testid='governance-shell-root']").waitFor();
  for (const surface of [
    "tenant-governance",
    "tenant-baseline-matrix",
    "config-diff-viewer",
    "policy-pack-history",
    "standards-watchlist",
    "legacy-reference-findings",
    "promotion-approval-status",
    "release-watch-status",
    "migration-posture",
  ]) {
    await page.locator(`[data-surface='${surface}']`).waitFor();
  }
}

async function runIncidentBrowserRegression(): Promise<void> {
  const playwright = await importPlaywright();
  const server = await startViteServer(
    OPS_APP_DIR,
    OPS_APP_URL,
    "4341",
    "/ops/incidents",
    "ops-console 470",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1120 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const assertRuntimeClean = attachRuntimeGuards(page, "470 incidents");
  try {
    await page.goto(`${OPS_APP_URL}/ops/incidents?state=normal`, { waitUntil: "networkidle" });
    await waitForIncidentSurfaces(page);
    const root = page.locator("[data-testid='ops-shell-root']");
    await expectAttribute(root, "data-current-path", "/ops/incidents");
    await expectAttribute(root, "data-incident-binding-state", "live");
    await expectAttribute(root, "data-incident-action-control-state", "live_control");
    await expectAttribute(
      page.locator("[data-surface='incident-telemetry-redaction']"),
      "data-payload-class",
      "metadata_only",
    );

    await page.locator("[data-testid='incident-evidence-investigation_timeline']").click();
    const evidenceDrawer = page.locator("[data-testid='incident-investigation-return']");
    await evidenceDrawer.waitFor();
    await expectAttribute(evidenceDrawer, "data-payload-class", "redacted_summary");
    assert(
      ((await evidenceDrawer.getAttribute("data-safe-return-token")) ?? "").startsWith(
        "ORT_INCIDENT_",
      ),
      "Incident evidence drawer must preserve a safe return token.",
    );
    await assertNoSensitiveText(page.locator("body"), "incident same-shell journey");
    await writeAccessibilitySnapshot(page, "470-incidents-normal.aria.txt");
    const normalScreenshot = path.join(OUTPUT_DIR, "470-incidents-same-shell-artifact.png");
    await page.screenshot({ path: normalScreenshot, fullPage: true });
    assertNoSensitiveScreenshot(normalScreenshot, "incident same-shell screenshot");

    await page.goto(`${OPS_APP_URL}/ops/incidents?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await waitForIncidentSurfaces(page);
    await expectAttribute(root, "data-overview-state", "permission_denied");
    await expectAttribute(root, "data-incident-binding-state", "blocked");
    await assertNoSensitiveText(page.locator("body"), "incident permission denied");
    await page.keyboard.press("Tab");
    const activeRole = await page.evaluate(() => document.activeElement?.getAttribute("role") ?? "");
    assert(["button", "link", ""].includes(activeRole), "Keyboard focus should land on an operable control.");
    const deniedScreenshot = path.join(OUTPUT_DIR, "470-incidents-permission-denied.png");
    await page.screenshot({ path: deniedScreenshot, fullPage: true });
    assertNoSensitiveScreenshot(deniedScreenshot, "incident permission-denied screenshot");

    assertRuntimeClean();
    assertNoTracePersistence();
  } finally {
    await browser.close();
    await stopServer(server.child);
  }
}

async function runTenantGovernanceBrowserRegression(): Promise<void> {
  const playwright = await importPlaywright();
  const server = await startViteServer(
    GOVERNANCE_APP_DIR,
    GOVERNANCE_APP_URL,
    "4342",
    "/ops/governance/tenants",
    "governance-console 470",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1120 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const assertRuntimeClean = attachRuntimeGuards(page, "470 tenant governance");

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);
    const root = page.locator("[data-testid='governance-shell-root']");
    const tenant = page.locator("[data-surface='tenant-governance']");
    await expectAttribute(root, "data-current-path", "/ops/governance/tenants");
    await expectAttribute(tenant, "data-binding-state", "live");
    await expectAttribute(tenant, "data-action-control-state", "review_required");
    await assertNoSensitiveText(page.locator("body"), "tenant normal");
    await writeAccessibilitySnapshot(page, "470-tenant-normal.aria.txt");
    const normalScreenshot = path.join(OUTPUT_DIR, "470-tenant-normal.png");
    await page.screenshot({ path: normalScreenshot, fullPage: true });
    assertNoSensitiveScreenshot(normalScreenshot, "tenant normal screenshot");

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=blocked`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);
    await expectAttribute(tenant, "data-scenario-state", "blocked");
    await expectAttribute(tenant, "data-binding-state", "blocked");
    await expectAttribute(
      page.locator("[data-surface='standards-watchlist']"),
      "data-compile-gate-state",
      "blocked",
    );
    await assertNoSensitiveText(page.locator("body"), "tenant compile blocked");
    const blockedScreenshot = path.join(OUTPUT_DIR, "470-tenant-compile-blocked.png");
    await page.screenshot({ path: blockedScreenshot, fullPage: true });
    assertNoSensitiveScreenshot(blockedScreenshot, "tenant compile-blocked screenshot");
    await context.close();
    assertRuntimeClean();

    const narrowContext = await browser.newContext({
      viewport: { width: 390, height: 920 },
      reducedMotion: "reduce",
    });
    const narrowPage = await narrowContext.newPage();
    const assertNarrowRuntimeClean = attachRuntimeGuards(narrowPage, "470 narrow reduced motion");
    await narrowPage.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=settlement-pending`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(narrowPage);
    await narrowPage.evaluate(() => {
      document.body.style.zoom = "2";
      document.body.setAttribute("data-test-zoom", "200");
    });
    await expectAttribute(
      narrowPage.locator("[data-surface='tenant-governance']"),
      "data-action-control-state",
      "settlement_pending",
    );
    await expectAttribute(narrowPage.locator("body"), "data-test-zoom", "200");
    await assertNoSensitiveText(narrowPage.locator("body"), "tenant narrow zoom");
    await writeAccessibilitySnapshot(narrowPage, "470-tenant-narrow-reduced-motion.aria.txt");
    const narrowScreenshot = path.join(OUTPUT_DIR, "470-narrow-reduced-motion-zoom.png");
    await narrowPage.screenshot({ path: narrowScreenshot, fullPage: true });
    assertNoSensitiveScreenshot(narrowScreenshot, "narrow reduced-motion zoom screenshot");
    await narrowContext.close();
    assertNarrowRuntimeClean();
    assertNoTracePersistence();
  } finally {
    await browser.close();
    await stopServer(server.child);
  }
}

export async function run(): Promise<void> {
  const suite = writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  assert.equal(suite.evidence.allCoveragePassed, true, "470 generated evidence must pass all coverage.");
  assert.equal(suite.evidence.noExternalTargets, true, "470 must remain local-only.");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await runIncidentBrowserRegression();
  await runTenantGovernanceBrowserRegression();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
