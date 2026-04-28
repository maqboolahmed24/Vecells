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
const APP_URL = "http://127.0.0.1:4314";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-assurance-454");

const scenarioCases = [
  [
    "normal",
    "normal",
    "live",
    "export_ready",
    "live_export",
    "export_ready",
    "external_handoff_ready",
    "complete",
  ],
  ["empty", "empty", "live", "collecting", "blocked", "blocked_graph", "summary_only", "complete"],
  [
    "stale",
    "stale",
    "diagnostic_only",
    "stale_pack",
    "diagnostic_only",
    "stale_pack",
    "governed_preview",
    "stale",
  ],
  [
    "degraded",
    "degraded",
    "diagnostic_only",
    "awaiting_attestation",
    "attestation_required",
    "pending_attestation",
    "governed_preview",
    "stale",
  ],
  [
    "freeze",
    "freeze",
    "recovery_only",
    "stale_pack",
    "recovery_only",
    "stale_pack",
    "governed_preview",
    "stale",
  ],
  [
    "blocked",
    "blocked",
    "blocked",
    "blocked_trust",
    "blocked",
    "blocked_trust",
    "summary_only",
    "blocked",
  ],
  [
    "permission-denied",
    "permission_denied",
    "blocked",
    "denied_scope",
    "blocked",
    "denied_scope",
    "summary_only",
    "blocked",
  ],
  [
    "settlement-pending",
    "settlement_pending",
    "diagnostic_only",
    "awaiting_attestation",
    "attestation_required",
    "pending_attestation",
    "governed_preview",
    "stale",
  ],
  [
    "quarantined",
    "quarantined",
    "blocked",
    "blocked_trust",
    "blocked",
    "blocked_trust",
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
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4314", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/assurance`, 25_000);
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

    await page.goto(`${APP_URL}/ops/assurance?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const center = page.locator("[data-surface='assurance-center']");
    await root.waitFor();
    await center.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/assurance");
    await expectAttribute(root, "data-assurance-binding-state", "live");
    await expectAttribute(root, "data-assurance-pack-state", "export_ready");
    await expectAttribute(root, "data-assurance-settlement-result", "export_ready");
    await expectAttribute(center, "data-framework", "DTAC");
    await expectAttribute(center, "data-binding-state", "live");
    await expectAttribute(center, "data-pack-state", "export_ready");
    await expectAttribute(center, "data-export-control-state", "live_export");
    await expectAttribute(center, "data-settlement-result", "export_ready");
    await page.locator("[data-surface='framework-selector']").waitFor();
    await page.locator("[data-surface='control-heat-map']").waitFor();
    await page.locator("[data-surface='control-heat-table']").waitFor();
    await page.locator("[data-surface='evidence-gap-queue']").waitFor();
    await page.locator("[data-surface='capa-tracker']").waitFor();
    await page.locator("[data-surface='pack-preview']").waitFor();
    await page.locator("[data-surface='pack-settlement']").waitFor();
    await page.locator("[data-surface='pack-export-state']").waitFor();
    assert.equal(
      await page.locator("[data-surface='control-heat-map'] .ops-assurance-cell").count(),
      6,
    );
    assert.equal(await page.locator("[data-surface='control-heat-table'] tbody tr").count(), 6);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-assurance-normal-desktop.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='assurance-framework-dspt']").click();
    await expectAttribute(center, "data-framework", "DSPT");
    await expectAttribute(center, "data-selected-control", "dspt:core");
    await page.locator("[data-testid='assurance-control-dspt_technical_security']").click();
    await expectAttribute(center, "data-selected-control", "dspt:technical-security");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-assurance-framework-and-control-selection.png"),
      fullPage: true,
    });

    const exportButton = page.locator("[data-testid='assurance-action-export_external']");
    await exportButton.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(center, "data-settlement-result", "export_ready");
    await expectAttribute(exportButton, "data-settlement-result", "export_ready");

    for (const [
      queryState,
      expectedState,
      bindingState,
      packState,
      exportControlState,
      settlementResult,
      artifactState,
      graphState,
    ] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/assurance?state=${queryState}`, { waitUntil: "networkidle" });
      await root.waitFor();
      await center.waitFor();
      await expectAttribute(root, "data-overview-state", expectedState);
      await expectAttribute(root, "data-assurance-binding-state", bindingState);
      await expectAttribute(root, "data-assurance-pack-state", packState);
      await expectAttribute(root, "data-assurance-settlement-result", settlementResult);
      await expectAttribute(center, "data-binding-state", bindingState);
      await expectAttribute(center, "data-pack-state", packState);
      await expectAttribute(center, "data-export-control-state", exportControlState);
      await expectAttribute(center, "data-settlement-result", settlementResult);
      await expectAttribute(center, "data-artifact-state", artifactState);
      await expectAttribute(
        page.locator("[data-surface='control-heat-map']"),
        "data-graph-state",
        graphState,
      );
      await expectAttribute(
        page.locator("[data-surface='pack-settlement']"),
        "data-settlement-result",
        settlementResult,
      );
      await expectAttribute(
        page.locator("[data-surface='pack-export-state']"),
        "data-artifact-state",
        artifactState,
      );
      if (exportControlState === "blocked" || exportControlState === "diagnostic_only") {
        assert.equal(
          await page.locator(".ops-assurance-action-rail button:not(:disabled)").count(),
          0,
          `${expectedState} should not expose export-capable controls.`,
        );
      }
      if (exportControlState === "attestation_required") {
        assert.equal(
          await page.locator(".ops-assurance-action-rail button:not(:disabled)").count(),
          1,
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-assurance-${expectedState}.png`),
        fullPage: true,
      });
    }

    await page.goto(`${APP_URL}/ops/assurance?state=degraded`, { waitUntil: "networkidle" });
    assertCondition(
      (await page.locator("[data-surface='capa-tracker']").innerText()).includes(
        "attestation_required",
      ),
      "Degraded slice did not expose attestation requirement.",
    );
    await page.goto(`${APP_URL}/ops/assurance?state=quarantined`, { waitUntil: "networkidle" });
    assertCondition(
      (await page.locator("[data-testid='selected-control-detail']").innerText()).includes(
        "slice:quarantined",
      ),
      "Quarantined slice did not expose blocker detail.",
    );
    await page.goto(`${APP_URL}/ops/assurance?state=normal`, { waitUntil: "networkidle" });
    assertCondition(
      (await page.locator("[data-surface='pack-preview']").innerText()).includes("Evidence set"),
      "Pack preview did not expose hash metadata.",
    );

    for (const [label, viewport, expectedLayout] of [
      ["desktop", { width: 1440, height: 1100 }, "two_plane"],
      ["laptop", { width: 1200, height: 900 }, "two_plane"],
      ["tablet", { width: 900, height: 1180 }, "mission_stack"],
      ["narrow", { width: 390, height: 920 }, "mission_stack"],
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`${APP_URL}/ops/assurance?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await center.waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-assurance-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-assurance-aria.json");
    assertCondition(aria.includes("Assurance Center"), "ARIA snapshot lost Assurance Center.");
    assertCondition(aria.includes("Control heat map"), "ARIA snapshot lost Control heat map.");
    assertCondition(aria.includes("Pack preview"), "ARIA snapshot lost Pack preview.");
    assertCondition(aria.includes("Pack settlement"), "ARIA snapshot lost Pack settlement.");
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/assurance?state=normal`, {
      waitUntil: "networkidle",
    });
    await reducedPage.locator("[data-surface='assurance-center']").waitFor();
    const transitionDuration = await reducedPage
      .locator(".ops-assurance-cell")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-assurance-reduced-motion.png"),
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
