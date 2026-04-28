import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4302";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-overview-450");

const scenarioCases = [
  ["normal", "normal"],
  ["stable", "stable_service"],
  ["empty", "empty"],
  ["stale", "stale"],
  ["degraded", "degraded"],
  ["quarantined", "quarantined"],
  ["blocked", "blocked"],
  ["permission-denied", "permission_denied"],
  ["freeze", "freeze"],
  ["settlement-pending", "settlement_pending"],
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
    await waitForHttp(`${APP_URL}/ops/overview`, 25_000);
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

async function writeAccessibilitySnapshot(page, name) {
  // Use page.accessibility.snapshot when this Playwright build exposes it.
  const accessibilityApi = page.accessibility;
  if (accessibilityApi?.snapshot) {
    const snapshot = await accessibilityApi.snapshot({ interestingOnly: false });
    fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(snapshot, null, 2));
    return JSON.stringify(snapshot);
  }
  const locatorSnapshot =
    typeof page.locator("body").ariaSnapshot === "function"
      ? await page.locator("body").ariaSnapshot()
      : await page.locator("body").evaluate((body) => body.innerText);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), String(locatorSnapshot));
  return String(locatorSnapshot);
}

export async function run() {
  const playwright = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { child } = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${APP_URL}/ops/overview?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-surface='ops-overview']");
    await root.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/overview");
    await expectAttribute(root, "data-overview-state", "normal");
    await expectAttribute(root, "data-layout-mode", "two_plane");
    await page.locator("[data-surface='north-star-band']").waitFor();
    await page.locator("[data-surface='service-health-grid']").waitFor();
    await page.locator("[data-surface='ops-freshness-strip']").waitFor();
    assert.equal(await page.locator("[data-surface='ops-health-cell']").count(), 6);
    assert.equal(
      await page.locator("[data-testid='north-star-band-fallback'] tbody tr").count(),
      6,
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-overview-normal-desktop.png"),
      fullPage: true,
    });

    const beforeOrder = await page
      .locator("[data-surface='ops-health-cell']")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-entity-ref")));
    const notificationCell = page.locator(
      "[data-surface='ops-health-cell'][data-entity-ref='svc_notification']",
    );
    await notificationCell.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(root, "data-selected-health-cell-ref", "svc_notification");
    const activeEntityRef = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-entity-ref"),
    );
    assert.equal(activeEntityRef, "svc_notification", "Health-cell selection stole focus.");
    const afterOrder = await page
      .locator("[data-surface='ops-health-cell']")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-entity-ref")));
    assert.deepEqual(afterOrder, beforeOrder, "Live health selection reordered cells.");

    const digestBefore = await root.getAttribute("data-board-state-digest-ref");
    await page.locator("[data-testid='ops-return-token-target']").click();
    await page.locator("[data-testid='ops-health-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/ops/overview/health/ops-route-07");
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");
    await expectAttribute(root, "data-selected-health-cell-ref", "svc_notification");
    assert.equal(await root.getAttribute("data-board-state-digest-ref"), digestBefore);

    const northStarCards = await page
      .locator("[data-surface='north-star-band'] .ops-north-star-card")
      .count();
    const northStarRows = await page
      .locator("[data-testid='north-star-band-fallback'] tbody tr")
      .count();
    const healthCells = await page.locator("[data-surface='ops-health-cell']").count();
    const healthRows = await page
      .locator("[data-testid='service-health-grid-fallback'] tbody tr")
      .count();
    assert.equal(northStarCards, northStarRows, "NorthStarBand visual/table parity drifted.");
    assert.equal(healthCells, healthRows, "ServiceHealthGrid visual/table parity drifted.");

    for (const [queryState, expectedState] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/overview?state=${queryState}`, { waitUntil: "networkidle" });
      await root.waitFor();
      await expectAttribute(root, "data-overview-state", expectedState);
      await page.locator("[data-surface='ops-freshness-strip']").waitFor();
      if (expectedState === "stable_service" || expectedState === "empty") {
        await page.locator("[data-surface='ops-stable-service-digest']").waitFor();
      }
      if (expectedState === "quarantined") {
        await expectAttribute(
          page.locator("[data-surface='ops-freshness-strip']"),
          "data-trust-state",
          "quarantined",
        );
      }
      if (expectedState === "permission_denied") {
        await expectAttribute(
          page.locator("[data-surface='ops-freshness-strip']"),
          "data-publication-state",
          "blocked",
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-overview-${expectedState}.png`),
        fullPage: true,
      });
    }

    for (const [label, viewport, expectedLayout] of [
      ["desktop", { width: 1440, height: 1100 }, "two_plane"],
      ["laptop", { width: 1200, height: 900 }, "two_plane"],
      ["tablet", { width: 900, height: 1180 }, "mission_stack"],
      ["narrow", { width: 390, height: 920 }, "mission_stack"],
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`${APP_URL}/ops/overview?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-overview-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-overview-aria.json");
    assertCondition(aria.includes("Operations console"), "ARIA snapshot lost operations landmark.");
    assertCondition(aria.includes("ServiceHealthGrid"), "ARIA snapshot lost health grid surface.");
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/overview?state=normal`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='ops-anomaly-ops-route-07']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-overview-reduced-motion.png"),
      fullPage: true,
    });
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopOpsConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
