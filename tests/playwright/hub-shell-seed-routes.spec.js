import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

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

async function telemetryStateCount(page) {
  return await page.evaluate(() => window.__hubDeskState?.telemetryCount ?? 0);
}

export async function run() {
  assertCondition(fs.existsSync(ARTIFACT_PATH), "Hub mock projection artifact is missing.");
  assertCondition(fs.existsSync(GALLERY_PATH), "Hub shell gallery HTML is missing.");
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  assert.equal(artifact.task_id, "par_118", "Hub mock projection artifact drifted off par_118.");
  assert.equal(artifact.visual_mode, "Hub_Shell_Seed_Routes", "Hub shell visual mode drifted.");
  assertCondition(
    artifact.examples.length >= 6,
    "Hub projection examples are unexpectedly sparse.",
  );

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

    const telemetryBefore = await telemetryStateCount(page);
    const nonexclusiveOption = page.locator(
      ".hub-option-card[data-option-card='opt-104-north-shore']",
    );
    await nonexclusiveOption.locator(".hub-option-card__select").click();
    await expectAttribute(root, "data-selected-option-card", "opt-104-north-shore");
    await expectAttribute(nonexclusiveOption, "data-reservation-truth", "truthful_nonexclusive");
    assertCondition(
      (await nonexclusiveOption.innerText()).includes("Visible but not exclusive"),
      "Nonexclusive option did not surface truthful no-hold copy.",
    );
    assertCondition(
      (await telemetryStateCount(page)) > telemetryBefore,
      "Option selection did not emit telemetry.",
    );

    await page.locator("[data-testid='hub-open-case-hub-case-104']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-104");
    await expectAttribute(root, "data-view-mode", "case");

    await page.locator("[data-testid='hub-open-alternatives']").click();
    await expectAttribute(root, "data-current-path", "/hub/alternatives/offer-session-104");
    await expectAttribute(root, "data-view-mode", "alternatives");
    await expectAttribute(root, "data-route-family", "rf_hub_case_management");
    await page.locator("[data-testid='hub-return-button']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-104");

    await page.locator("[data-testid='hub-open-audit']").click();
    await expectAttribute(root, "data-current-path", "/hub/audit/hub-case-104");
    await expectAttribute(root, "data-view-mode", "audit");
    await page.locator("[data-testid='hub-return-button']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-104");

    await page.locator("[data-testid='hub-nav-exceptions']").click();
    await expectAttribute(root, "data-current-path", "/hub/exceptions");
    await expectAttribute(root, "data-view-mode", "exceptions");
    await expectAttribute(root, "data-artifact-mode", "table_only");
    const callbackException = page.locator("[data-testid='hub-exception-row-exc-callback-052']");
    await callbackException.click();
    await expectAttribute(callbackException, "data-fallback-type", "callback_request");
    await page.locator("[data-testid='HubExceptionDetailDrawer'] .hub-primary-button").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-052");
    await expectAttribute(root, "data-selected-option-card", "opt-052-variance");
    await expectAttribute(
      page.locator(".hub-option-card[data-option-card='opt-052-variance']"),
      "data-reservation-truth",
      "unavailable",
    );
    await page.locator("[data-testid='hub-callback-fallback']").waitFor();

    await page.locator("[data-testid='hub-nav-queue']").click();
    await page.locator("[data-testid='hub-open-case-hub-case-066']").click();
    await expectAttribute(root, "data-current-path", "/hub/case/hub-case-066");
    await expectAttribute(root, "data-selected-option-card", "opt-066-booked");
    await expectAttribute(root, "data-dominant-action", "Chase acknowledgement");
    const bookedOption = page.locator(".hub-option-card[data-option-card='opt-066-booked']");
    await expectAttribute(bookedOption, "data-reservation-truth", "truthful_nonexclusive");
    assertCondition(
      (await bookedOption.innerText()).includes("Acknowledgement debt open"),
      "Booked acknowledgement case did not surface overdue acknowledgement debt.",
    );

    await page.setViewportSize({ width: 720, height: 1280 });
    await page.waitForTimeout(150);
    await expectAttribute(root, "data-layout-mode", "mission_stack");

    const focusRestoreMarker = page.locator("[data-testid='hub-focus-restore-marker']");
    await focusRestoreMarker.waitFor({ state: "attached" });
    await expectAttribute(focusRestoreMarker, "data-dom-marker", "focus-restore");
    assertCondition(
      await focusRestoreMarker.evaluate((element) => element.hidden),
      "Hub focus restore marker is visible on the default route.",
    );

    assertCondition(
      (await telemetryCount(page)) === 0,
      "Telemetry log is visible on the default hub route.",
    );
    await page.goto(`${APP_URL}/hub/queue?diagnostics=hub`, { waitUntil: "networkidle" });
    assertCondition(
      (await telemetryCount(page)) > 0,
      "Diagnostics telemetry did not render behind the hub flag.",
    );
    assert.equal(
      externalRequests.size,
      0,
      `Unexpected external requests: ${[...externalRequests].join(", ")}`,
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1080 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/hub/queue`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator(".hub-option-card[data-option-card='opt-104-riverside']")
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
