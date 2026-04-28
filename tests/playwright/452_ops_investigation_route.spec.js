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
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-investigation-452");

const scenarioCases = [
  ["normal", "normal", "complete", "export_ready"],
  ["empty", "empty", "complete", "export_ready"],
  ["stale", "stale", "stale", "summary_only"],
  ["degraded", "degraded", "stale", "redaction_review"],
  ["quarantined", "quarantined", "blocked", "blocked"],
  ["blocked", "blocked", "blocked", "blocked"],
  ["permission-denied", "permission_denied", "blocked", "blocked"],
  ["settlement-pending", "settlement_pending", "stale", "redaction_review"],
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
    await waitForHttp(`${APP_URL}/ops/audit`, 25_000);
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

async function activeEntityRef(page) {
  return await page.evaluate(() => document.activeElement?.getAttribute("data-entity-ref"));
}

async function waitForActiveEntityRef(page, expected) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    if ((await activeEntityRef(page)) === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(await activeEntityRef(page), expected, "Safe return did not restore focus.");
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
    const root = page.locator("[data-testid='ops-shell-root']");
    await root.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/overview");
    await expectAttribute(root, "data-investigation-graph-verdict", "complete");
    await page.locator("[data-testid='ops-route-button-investigations']").click();
    const drawer = page.locator("[data-surface='investigation-drawer']");
    await drawer.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/overview/investigations/ops-route-07");
    await expectAttribute(drawer, "data-drawer-delta-state", "aligned");
    await page.locator("[data-surface='investigation-question']").waitFor();
    await page.locator("[data-surface='proof-basis']").waitFor();
    await page.locator("[data-surface='timeline-ladder']").waitFor();
    await page.locator("[data-surface='evidence-graph-mini-map']").waitFor();
    const stableQuestionHash = await drawer.getAttribute("data-investigation-question-hash");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-investigation-drawer-overview-normal.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='ops-delta-stale']").click();
    await expectAttribute(drawer, "data-drawer-delta-state", "drifted");
    assert.equal(
      await drawer.getAttribute("data-investigation-question-hash"),
      stableQuestionHash,
      "Drawer rebased the question hash when live proof drifted.",
    );
    await expectAttribute(root, "data-investigation-graph-verdict", "stale");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-investigation-drawer-stale-drift.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='ops-return-button']").click();
    await expectAttribute(root, "data-current-path", "/ops/overview");
    await waitForActiveEntityRef(page, "ops-route-07");

    await page.goto(`${APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
    await root.waitFor();
    const investigationButton = page.locator("[data-testid='ops-route-button-investigations']");
    await investigationButton.focus();
    await page.keyboard.press("Enter");
    await drawer.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/queues/investigations/ops-route-07");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-investigation-drawer-keyboard-queues.png"),
      fullPage: true,
    });

    await page.locator("button", { hasText: "Open full audit route" }).click();
    const auditExplorer = page.locator("[data-surface='audit-explorer']");
    await auditExplorer.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/audit");
    await expectAttribute(auditExplorer, "data-graph-verdict", "complete");
    await expectAttribute(auditExplorer, "data-export-state", "export_ready");
    await page.locator("[data-surface='break-glass-review']").waitFor();
    await page.locator("[data-surface='support-replay-boundary']").waitFor();
    await page.locator("[data-surface='investigation-bundle-export']").waitFor();
    assert.equal(await page.locator("[data-surface='timeline-ladder']").count(), 1);
    assert.equal(await page.locator("[data-surface='evidence-graph-mini-map']").count(), 1);
    assertCondition(
      (await page.locator("[aria-label='Audit filters']").innerText()).includes("4 results"),
      "Audit scoped filters lost result count.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-audit-explorer-normal-desktop.png"),
      fullPage: true,
    });

    await page.goto(`${APP_URL}/ops/audit?state=permission-denied`, { waitUntil: "networkidle" });
    await root.waitFor();
    await auditExplorer.waitFor();
    await expectAttribute(root, "data-overview-state", "permission_denied");
    await expectAttribute(auditExplorer, "data-graph-verdict", "blocked");
    await expectAttribute(auditExplorer, "data-export-state", "blocked");
    await expectAttribute(
      page.locator("[data-surface='break-glass-review']"),
      "data-authorized-visibility",
      "false",
    );
    await expectAttribute(
      page.locator("[data-surface='support-replay-boundary']"),
      "data-restore-eligibility-state",
      "blocked",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-audit-explorer-permission-denied.png"),
      fullPage: true,
    });

    for (const [queryState, expectedState, graphVerdict, exportState] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/audit?state=${queryState}`, { waitUntil: "networkidle" });
      await root.waitFor();
      await auditExplorer.waitFor();
      await expectAttribute(root, "data-overview-state", expectedState);
      await expectAttribute(root, "data-investigation-graph-verdict", graphVerdict);
      await expectAttribute(root, "data-investigation-export-state", exportState);
      await expectAttribute(auditExplorer, "data-graph-verdict", graphVerdict);
      await expectAttribute(auditExplorer, "data-export-state", exportState);
      if (expectedState === "settlement_pending") {
        await expectAttribute(
          page.locator("[data-surface='support-replay-boundary']"),
          "data-restore-eligibility-state",
          "awaiting_external_hold",
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-audit-explorer-${expectedState}.png`),
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
      await page.goto(`${APP_URL}/ops/audit?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await auditExplorer.waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-investigation-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-investigation-aria.json");
    assertCondition(aria.includes("Audit Explorer"), "ARIA snapshot lost Audit Explorer.");
    assertCondition(aria.includes("Timeline ladder"), "ARIA snapshot lost Timeline ladder.");
    assertCondition(aria.includes("Break-glass review"), "ARIA snapshot lost Break-glass review.");
    assertCondition(aria.includes("Support replay"), "ARIA snapshot lost Support replay.");
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/overview?state=normal`, { waitUntil: "networkidle" });
    await reducedPage.locator("[data-testid='ops-route-button-investigations']").click();
    await reducedPage.locator("[data-surface='investigation-drawer']").waitFor();
    const transitionDuration = await reducedPage
      .locator("[data-surface='investigation-drawer']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-investigation-reduced-motion.png"),
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
