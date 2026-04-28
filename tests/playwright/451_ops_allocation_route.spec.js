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
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-allocation-451");

const scenarioCases = [
  ["normal", "normal", "executable"],
  ["empty", "empty", "observe_only"],
  ["stale", "stale", "stale_reacquire"],
  ["degraded", "degraded", "handoff_required"],
  ["quarantined", "quarantined", "read_only_recovery"],
  ["blocked", "blocked", "blocked"],
  ["permission-denied", "permission_denied", "blocked"],
  ["settlement-pending", "settlement_pending", "observe_only"],
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
    await waitForHttp(`${APP_URL}/ops/queues`, 25_000);
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

async function allocationRowOrder(page) {
  return await page
    .locator("[data-surface='bottleneck-radar-row']")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-entity-ref")));
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

    await page.goto(`${APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    await root.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/queues");
    await expectAttribute(root, "data-ops-lens", "queues");
    await expectAttribute(root, "data-layout-mode", "two_plane");
    await expectAttribute(root, "data-action-eligibility-state", "executable");
    await page.locator("[data-surface='bottleneck-radar']").waitFor();
    await page.locator("[data-surface='capacity-allocator']").waitFor();
    await page.locator("[data-surface='cohort-impact-matrix']").waitFor();
    await page.locator("[data-surface='intervention-workbench']").waitFor();
    await page.locator("[data-surface='action-eligibility-state']").waitFor();
    await page.locator("[data-surface='scenario-compare']").waitFor();

    assert.equal(await page.locator("[data-surface='bottleneck-radar-row']").count(), 5);
    assert.equal(await page.locator("[data-testid='ops-capacity-allocator'] tbody tr").count(), 3);
    assert.equal(
      await page.locator("[data-testid='ops-cohort-impact-matrix'] tbody tr").count(),
      4,
    );
    assert.equal(
      await page.locator("[data-testid='ops-cohort-impact-matrix'] .ops-cohort-grid__cell").count(),
      4,
      "Cohort matrix visual/table parity drifted.",
    );
    assert.notEqual(
      await page
        .locator("[data-surface='bottleneck-radar-row'][data-entity-ref='ops-route-21']")
        .getAttribute("data-rank"),
      "1",
      "Low-sample cohort became the dominant bottleneck.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-allocation-queues-normal-desktop.png"),
      fullPage: true,
    });

    const beforeOrder = await allocationRowOrder(page);
    const supplierRow = page.locator(
      "[data-surface='bottleneck-radar-row'][data-entity-ref='ops-route-04']",
    );
    await supplierRow.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(root, "data-selected-anomaly-id", "ops-route-04");
    const focusedEntityRef = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-entity-ref"),
    );
    assert.equal(focusedEntityRef, "ops-route-04", "Selecting a bottleneck stole focus.");
    assert.deepEqual(
      await allocationRowOrder(page),
      beforeOrder,
      "Selection reordered the ladder.",
    );

    await page.locator("[data-testid='ops-delta-buffered']").click();
    await expectAttribute(root, "data-delta-gate", "buffered");
    await expectAttribute(root, "data-selected-anomaly-id", "ops-route-04");
    assert.deepEqual(await allocationRowOrder(page), beforeOrder, "Live patch stole rank order.");

    await page.locator("[data-testid='ops-delta-stale']").click();
    await expectAttribute(root, "data-action-eligibility-state", "stale_reacquire");
    await expectAttribute(root, "data-workbench-state", "frozen");

    await page.goto(`${APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
    await root.waitFor();
    await page
      .locator("[data-surface='bottleneck-radar-row'][data-entity-ref='ops-route-04']")
      .click();
    const compareOrder = await allocationRowOrder(page);
    await page.locator("[data-testid='ops-scenario-compare-button']").click();
    await page.locator("[data-testid='ops-compare-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/ops/queues/compare/ops-route-04");
    assert.deepEqual(await allocationRowOrder(page), compareOrder, "Compare mode reordered rows.");
    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/queues");

    await page.locator("[data-testid='ops-governance-button']").click();
    await page.locator("[data-surface='ops-governance-handoff']").waitFor();
    await page.locator("[data-testid='ops-governance-return']").click();

    await page.goto(`${APP_URL}/ops/capacity?state=normal`, { waitUntil: "networkidle" });
    await root.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/capacity");
    await expectAttribute(root, "data-ops-lens", "capacity");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-allocation-capacity-normal-desktop.png"),
      fullPage: true,
    });

    for (const [queryState, expectedState, eligibilityState] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/queues?state=${queryState}`, { waitUntil: "networkidle" });
      await root.waitFor();
      await expectAttribute(root, "data-allocation-route-state", expectedState);
      await expectAttribute(root, "data-action-eligibility-state", eligibilityState);
      if (expectedState === "settlement_pending") {
        await expectAttribute(root, "data-candidate-lease-state", "observe_only");
        await expectAttribute(
          page.locator("[data-surface='intervention-workbench']"),
          "data-settlement-status",
          "pending_effect",
        );
      }
      if (expectedState === "quarantined") {
        await expectAttribute(root, "data-action-eligibility-state", "read_only_recovery");
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-allocation-queues-${expectedState}.png`),
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
      await page.goto(`${APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-allocation-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-allocation-aria.json");
    assertCondition(aria.includes("BottleneckRadar"), "ARIA snapshot lost BottleneckRadar.");
    assertCondition(aria.includes("CapacityAllocator"), "ARIA snapshot lost CapacityAllocator.");
    assertCondition(aria.includes("CohortImpactMatrix"), "ARIA snapshot lost CohortImpactMatrix.");
    assertCondition(
      aria.includes("InterventionWorkbench"),
      "ARIA snapshot lost InterventionWorkbench.",
    );
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='ops-anomaly-ops-route-07']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-allocation-reduced-motion.png"),
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
