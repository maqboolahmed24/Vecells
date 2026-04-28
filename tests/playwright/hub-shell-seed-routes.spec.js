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
const APP_DIR = path.join(ROOT, "apps", "hub-desk");
const APP_URL = "http://127.0.0.1:4303";
const ARTIFACT_PATH = path.join(ROOT, "data", "analysis", "hub_mock_projection_examples.json");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "118_hub_shell_gallery.html");
const SCREENSHOT_DIR = path.join(ROOT, ".artifacts", "hub-shell-seed");

export const hubShellSeedCoverage = [
  "first-load /hub/queue",
  "same-shell queue to case continuity",
  "exclusive hold and truthful nonexclusive timer posture",
  "alternatives and audit child routes",
  "exceptions table and callback-transfer blockers",
  "focus restore marker and DOM telemetry",
  "responsive mission_stack behavior",
  "reduced-motion equivalence",
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function startHubDesk() {
  const child = spawn("pnpm", ["dev"], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "4303",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/hub/queue`, 20_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`hub-desk failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopHubDesk(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function telemetryCount(page) {
  return await page.locator("[data-testid='hub-telemetry-log'] li").count();
}

export async function run() {
  assertCondition(fs.existsSync(ARTIFACT_PATH), "Hub mock projection artifact is missing.");
  assertCondition(fs.existsSync(GALLERY_PATH), "Hub shell gallery HTML is missing.");
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  assert.equal(artifact.task_id, "par_118", "Hub mock projection artifact drifted off par_118.");
  assert.equal(artifact.visual_mode, "Hub_Shell_Seed_Routes", "Hub shell visual mode drifted.");
  assertCondition(artifact.examples.length >= 6, "Hub projection examples are unexpectedly sparse.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const { child } = await startHubDesk();
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

    await page.goto(`${APP_URL}/hub/queue`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='hub-shell-root']").waitFor();

    const root = page.locator("[data-testid='hub-shell-root']");
    await expectAttribute(root, "data-current-path", "/hub/queue");
    await expectAttribute(root, "data-view-mode", "queue");
    await expectAttribute(root, "data-layout-mode", "two_plane");
    await expectAttribute(root, "data-automation-surface", "rf_hub_queue");

    const telemetryBefore = await telemetryCount(page);
    await page.locator("[data-testid='hub-option-hub-opt-104-river']").click();
    await expectAttribute(root, "data-selected-option-id", "hub-opt-104-river");
    await expectAttribute(root, "data-option-truth-mode", "truthful_nonexclusive");
    await expectAttribute(root, "data-timer-mode", "response_window");
    assertCondition((await telemetryCount(page)) > telemetryBefore, "Option selection did not emit telemetry.");

    await page.locator("[data-testid='hub-open-alternatives']").click();
    await page.locator("[data-testid='hub-alternatives-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/hub/alternatives/ofs_104");
    await expectAttribute(root, "data-route-family", "rf_hub_case_management");
    await page.locator("[data-testid='hub-return-button']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-104");

    await page.locator("[data-testid='hub-open-audit']").click();
    await page.locator("[data-testid='hub-audit-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/hub/audit/hub-case-104");
    await page.locator("[data-testid='hub-return-button']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-104");

    await page.locator("[data-testid='hub-nav-exceptions']").click();
    await page.locator("[data-testid='hub-exceptions-route']").waitFor();
    await expectAttribute(root, "data-view-mode", "exceptions");
    await expectAttribute(root, "data-artifact-mode", "table_only");
    await page.locator("[data-testid='hub-filter-fallback']").click();
    await page.locator("[data-testid='hub-open-exception-case-hub-case-052']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-052");
    await expectAttribute(root, "data-option-truth-mode", "callback_only");

    await page.locator("[data-testid='hub-nav-queue']").click();
    await page.locator("[data-testid='hub-open-case-hub-case-066']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-066");
    await expectAttribute(root, "data-ack-state", "overdue");

    await page.setViewportSize({ width: 720, height: 1280 });
    await page.waitForTimeout(150);
    await expectAttribute(root, "data-layout-mode", "mission_stack");

    const focusRestoreMarker = page.locator("[data-testid='hub-focus-restore-marker']");
    await focusRestoreMarker.waitFor();
    await expectAttribute(focusRestoreMarker, "data-dom-marker", "focus-restore");

    const telemetryAfter = await telemetryCount(page);
    assertCondition(telemetryAfter >= 5, "Telemetry log did not accumulate the expected hub events.");
    assert.equal(externalRequests.size, 0, `Unexpected external requests: ${[...externalRequests].join(", ")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1080 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/hub/queue`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='hub-option-hub-opt-104-oak']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopHubDesk(child);
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

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
