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
const APP_URL = "http://127.0.0.1:4313";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-resilience-453");

const scenarioCases = [
  [
    "normal",
    "normal",
    "live_control",
    "live",
    "published",
    "current",
    "applied",
    "external_handoff_ready",
    "exact",
  ],
  [
    "empty",
    "empty",
    "live_control",
    "live",
    "published",
    "current",
    "applied",
    "external_handoff_ready",
    "exact",
  ],
  [
    "stale",
    "stale",
    "diagnostic_only",
    "diagnostic_only",
    "stale",
    "stale",
    "stale_scope",
    "governed_preview",
    "stale",
  ],
  [
    "degraded",
    "degraded",
    "diagnostic_only",
    "diagnostic_only",
    "published",
    "current",
    "blocked_trust",
    "governed_preview",
    "stale",
  ],
  [
    "freeze",
    "freeze",
    "governed_recovery",
    "recovery_only",
    "published",
    "current",
    "frozen",
    "recovery_only",
    "stale",
  ],
  [
    "blocked",
    "blocked",
    "blocked",
    "blocked",
    "rehearsal_required",
    "missing",
    "blocked_readiness",
    "summary_only",
    "blocked",
  ],
  [
    "permission-denied",
    "permission_denied",
    "blocked",
    "blocked",
    "withdrawn",
    "missing",
    "blocked_publication",
    "summary_only",
    "blocked",
  ],
  [
    "settlement-pending",
    "settlement_pending",
    "governed_recovery",
    "recovery_only",
    "published",
    "current",
    "accepted_pending_evidence",
    "recovery_only",
    "stale",
  ],
  [
    "quarantined",
    "quarantined",
    "blocked",
    "blocked",
    "withdrawn",
    "missing",
    "blocked_guardrail",
    "summary_only",
    "blocked",
  ],
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function startOpsConsole() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4313", "--strictPort"],
    {
      cwd: APP_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/ops/resilience`, 25_000);
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

    await page.goto(`${APP_URL}/ops/resilience?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const board = page.locator("[data-surface='resilience-board']");
    await root.waitFor();
    await board.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/resilience");
    await expectAttribute(root, "data-resilience-control-state", "live_control");
    await expectAttribute(root, "data-resilience-binding-state", "live");
    await expectAttribute(root, "data-resilience-settlement-result", "applied");
    await expectAttribute(board, "data-resilience-state", "live_control");
    await expectAttribute(board, "data-binding-state", "live");
    await expectAttribute(board, "data-runbook-state", "published");
    await expectAttribute(board, "data-backup-state", "current");
    await page.locator("[data-surface='essential-function-map']").waitFor();
    await page.locator("[data-surface='operational-readiness-snapshot']").waitFor();
    await page.locator("[data-surface='dependency-restore-bands']").waitFor();
    await page.locator("[data-surface='backup-freshness']").waitFor();
    await page.locator("[data-surface='runbook-binding']").waitFor();
    await page.locator("[data-surface='recovery-control-posture']").waitFor();
    await page.locator("[data-surface='recovery-run-timeline']").waitFor();
    await page.locator("[data-surface='recovery-action-rail']").waitFor();
    await page.locator("[data-surface='resilience-settlement']").waitFor();
    await page.locator("[data-surface='recovery-artifact-stage']").waitFor();
    assert.equal(
      await page.locator("[data-surface='dependency-restore-bands'] tbody tr").count(),
      10,
    );
    assert.equal(await page.locator("[data-surface='recovery-action-rail'] button").count(), 10);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-resilience-normal-desktop.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='resilience-function-pharmacy_referral_loop']").click();
    await expectAttribute(board, "data-selected-function", "pharmacy_referral_loop");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-resilience-selected-function.png"),
      fullPage: true,
    });

    const restoreButton = page.locator("[data-testid='resilience-action-restore_start']");
    await restoreButton.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(board, "data-settlement-result", "applied");
    await expectAttribute(restoreButton, "data-settlement-result", "applied");

    for (const [
      queryState,
      expectedState,
      controlState,
      bindingState,
      runbookState,
      backupState,
      settlementResult,
      artifactState,
      timelineState,
    ] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/resilience?state=${queryState}`, {
        waitUntil: "networkidle",
      });
      await root.waitFor();
      await board.waitFor();
      await expectAttribute(root, "data-overview-state", expectedState);
      await expectAttribute(root, "data-resilience-control-state", controlState);
      await expectAttribute(root, "data-resilience-binding-state", bindingState);
      await expectAttribute(root, "data-resilience-settlement-result", settlementResult);
      await expectAttribute(board, "data-resilience-state", controlState);
      await expectAttribute(board, "data-binding-state", bindingState);
      await expectAttribute(board, "data-runbook-state", runbookState);
      await expectAttribute(board, "data-backup-state", backupState);
      await expectAttribute(board, "data-settlement-result", settlementResult);
      await expectAttribute(board, "data-artifact-state", artifactState);
      await expectAttribute(board, "data-timeline-state", timelineState);
      await expectAttribute(
        page.locator("[data-surface='resilience-settlement']"),
        "data-settlement-result",
        settlementResult,
      );
      await expectAttribute(
        page.locator("[data-surface='recovery-artifact-stage']"),
        "data-artifact-state",
        artifactState,
      );
      if (controlState === "blocked" || controlState === "diagnostic_only") {
        assert.equal(
          await page.locator("[data-surface='recovery-action-rail'] button:not(:disabled)").count(),
          0,
          `${expectedState} should not expose live recovery controls.`,
        );
      }
      if (expectedState === "settlement_pending") {
        assert.equal(
          await page
            .locator("[data-surface='recovery-action-rail'] button[data-action-allowed='true']")
            .count(),
          4,
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-resilience-${expectedState}.png`),
        fullPage: true,
      });
    }

    await page.goto(`${APP_URL}/ops/resilience?state=stale`, { waitUntil: "networkidle" });
    await expectAttribute(
      page.locator("[data-surface='recovery-run-timeline']"),
      "data-timeline-state",
      "stale",
    );
    assertCondition(
      (await page.locator("[data-surface='recovery-run-timeline']").innerText()).includes(
        "history",
      ),
      "Stale timeline did not show historical-only recovery proof.",
    );

    await page.goto(`${APP_URL}/ops/resilience?state=blocked`, { waitUntil: "networkidle" });
    await expectAttribute(
      page.locator("[data-surface='backup-freshness']"),
      "data-backup-state",
      "missing",
    );

    for (const [label, viewport, expectedLayout] of [
      ["desktop", { width: 1440, height: 1100 }, "two_plane"],
      ["laptop", { width: 1200, height: 900 }, "two_plane"],
      ["tablet", { width: 900, height: 1180 }, "mission_stack"],
      ["narrow", { width: 390, height: 920 }, "mission_stack"],
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`${APP_URL}/ops/resilience?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await board.waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-resilience-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-resilience-aria.json");
    assertCondition(aria.includes("Resilience Board"), "ARIA snapshot lost Resilience Board.");
    assertCondition(
      aria.includes("Dependency restore bands"),
      "ARIA snapshot lost Dependency restore bands.",
    );
    assertCondition(
      aria.includes("RecoveryControlPosture"),
      "ARIA snapshot lost RecoveryControlPosture.",
    );
    assertCondition(
      aria.includes("Recovery evidence artifact"),
      "ARIA snapshot lost Recovery evidence artifact.",
    );
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/resilience?state=normal`, {
      waitUntil: "networkidle",
    });
    await reducedPage.locator("[data-surface='resilience-board']").waitFor();
    const transitionDuration = await reducedPage
      .locator(".ops-restore-node")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-resilience-reduced-motion.png"),
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
