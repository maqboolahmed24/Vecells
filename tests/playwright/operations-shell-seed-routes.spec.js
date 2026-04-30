import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  importPlaywright,
  waitForHttp,
} from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4302";
const ARTIFACT_PATH = path.join(ROOT, "data", "analysis", "operations_mock_projection_examples.json");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "117_operations_shell_gallery.html");
const SCREENSHOT_DIR = path.join(ROOT, ".artifacts", "operations-shell-seed");

export const operationsShellSeedCoverage = [
  "first-load /ops/overview",
  "promoted anomaly selection and persistence",
  "investigation, compare, intervention, and health child routes",
  "paused or buffered delta posture",
  "stale or degraded workbench posture",
  "visualization parity downgrade",
  "governance handoff stub and safe return",
  "responsive mission_stack behavior",
  "DOM markers and telemetry emission on board-state changes",
  "reduced-motion equivalence",
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function startOpsConsole() {
  const child = spawn("pnpm", ["dev"], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "4302",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/ops/overview`, 20_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopOpsConsole(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function telemetryCount(page) {
  return await page.locator("[data-testid='ops-telemetry-log'] li").count();
}

async function telemetryStateCount(page) {
  return await page.evaluate(() => window.__opsShellState?.telemetryCount ?? 0);
}

export async function run() {
  assertCondition(fs.existsSync(ARTIFACT_PATH), "Operations mock projection artifact is missing.");
  assertCondition(fs.existsSync(GALLERY_PATH), "Operations shell gallery HTML is missing.");
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  assert.equal(artifact.task_id, "par_117", "Operations mock projection artifact drifted off par_117.");
  assert.equal(
    artifact.visual_mode,
    "Operations_Shell_Seed_Routes",
    "Operations shell visual mode drifted.",
  );
  assertCondition(artifact.examples.length >= 6, "Operations projection examples are unexpectedly sparse.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const { child } = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 1200 },
    });
    const page = await context.newPage();
    const externalRequests = new Set();
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(APP_URL) && !url.startsWith("data:") && !url.startsWith("about:")) {
        externalRequests.add(url);
      }
    });

    await page.goto(`${APP_URL}/ops/overview`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='ops-shell-root']").waitFor();

    const root = page.locator("[data-testid='ops-shell-root']");
    await expectAttribute(root, "data-current-path", "/ops/overview");
    await expectAttribute(root, "data-layout-mode", "two_plane");
    await expectAttribute(root, "data-automation-surface", "rf_operations_board");

    const telemetryBefore = await telemetryStateCount(page);
    await page.locator("[data-testid='ops-anomaly-ops-route-04']").click();
    await expectAttribute(root, "data-selected-anomaly-id", "ops-route-04");
    assertCondition(
      (await telemetryStateCount(page)) > telemetryBefore,
      "Anomaly selection did not emit telemetry.",
    );

    await page.locator("[data-testid='ops-delta-buffered']").click();
    await expectAttribute(root, "data-delta-gate", "buffered");
    await expectAttribute(root, "data-selected-anomaly-id", "ops-route-04");

    await page.locator("[data-testid='ops-route-button-investigations']").click();
    await page.locator("[data-testid='ops-investigation-route']").waitFor();
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");

    await page.locator("[data-testid='ops-route-button-compare']").click();
    await page.locator("[data-testid='ops-compare-route']").waitFor();
    await expectAttribute(root, "data-layout-mode", "three_plane");
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");

    await page.locator("[data-testid='ops-route-button-interventions']").click();
    await page.locator("[data-testid='ops-intervention-route']").waitFor();
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");

    await page.locator("[data-testid='ops-route-button-health']").click();
    await page.locator("[data-testid='ops-health-route']").waitFor();
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");

    await page.locator("[data-testid='ops-delta-stale']").click();
    await expectAttribute(root, "data-workbench-state", "frozen");

    await page.locator("[data-testid='ops-delta-table_only']").click();
    await expectAttribute(root, "data-parity-mode", "table_only");
    await expectAttribute(page.locator("[data-testid='ops-service-health-grid']"), "data-parity-mode", "table_only");

    await page.locator("[data-testid='ops-governance-button']").click();
    await page.locator("[data-testid='ops-governance-handoff']").waitFor();
    await page.locator("[data-testid='ops-governance-return']").click();
    await assertHidden(page, "[data-testid='ops-governance-handoff']");

    await page.setViewportSize({ width: 720, height: 1280 });
    await page.waitForTimeout(150);
    await expectAttribute(root, "data-layout-mode", "mission_stack");

    await assertHidden(page, "[data-testid='ops-focus-restore-marker']");

    assertCondition(
      (await telemetryCount(page)) === 0,
      "Telemetry log is visible on the default operations route.",
    );
    await page.goto(`${APP_URL}/ops/overview?diagnostics=ops`, { waitUntil: "networkidle" });
    const diagnosticsTelemetry = await telemetryCount(page);
    assertCondition(diagnosticsTelemetry > 0, "Diagnostics telemetry did not render behind the ops flag.");
    const focusRestoreMarker = page.locator("[data-testid='ops-focus-restore-marker']");
    await focusRestoreMarker.waitFor();
    await expectAttribute(focusRestoreMarker, "data-dom-marker", "focus-restore");
    assert.equal(externalRequests.size, 0, `Unexpected external requests: ${[...externalRequests].join(", ")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1080 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/overview`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='ops-anomaly-ops-route-07']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0s") ||
        transitionDuration.includes("0.01ms") ||
        transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopOpsConsole(child);
  }
}

async function expectAttribute(locator, name, expected) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

async function assertHidden(page, selector) {
  const count = await page.locator(selector).count();
  if (count === 0) {
    return;
  }
  await page.locator(selector).waitFor({ state: "hidden" });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
