import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "pharmacy-console");
const APP_URL = "http://127.0.0.1:4304";
const ARTIFACT_PATH = path.join(ROOT, "data", "analysis", "pharmacy_mock_projection_examples.json");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "120_pharmacy_shell_gallery.html");

export const pharmacyShellSeedCoverage = [
  "first-load /workspace/pharmacy",
  "queue row selection and case workbench continuity",
  "checkpoint and line-item preservation through child routes",
  "inventory truth, dispatch proof, and assurance child routes",
  "table-only parity downgrade for weak-match outcome posture",
  "reopen-for-safety recovery posture",
  "responsive mission_stack behavior",
  "DOM markers and telemetry emission on shell-state changes",
  "reduced-motion equivalence",
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function startPharmacyConsole() {
  const child = spawn("pnpm", ["dev"], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "4304",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/workspace/pharmacy`, 20_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`pharmacy-console failed to start.\n${logs.join("")}`, {
      cause: error,
    });
  }
  return { child, logs };
}

async function stopPharmacyConsole(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function telemetryCount(page) {
  return await page.locator("[data-testid='pharmacy-telemetry-log'] li").count();
}

async function assertHidden(page, selector) {
  assert.equal(await page.locator(selector).count(), 0, `${selector} should not be visible.`);
}

export async function run() {
  assertCondition(fs.existsSync(ARTIFACT_PATH), "Pharmacy mock projection artifact is missing.");
  assertCondition(fs.existsSync(GALLERY_PATH), "Pharmacy shell gallery HTML is missing.");
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  assert.equal(
    artifact.task_id,
    "par_120",
    "Pharmacy mock projection artifact drifted off par_120.",
  );
  assert.equal(
    artifact.visual_mode,
    "Pharmacy_Shell_Seed_Routes",
    "Pharmacy shell visual mode drifted.",
  );
  assertCondition(
    artifact.examples.length >= 8,
    "Pharmacy projection examples are unexpectedly sparse.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child } = await startPharmacyConsole();
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

    await page.goto(`${APP_URL}/workspace/pharmacy`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='pharmacy-shell-root']").waitFor();

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy");
    await expectAttribute(root, "data-layout-mode", "two_plane");
    await expectAttribute(root, "data-automation-surface", "rf_pharmacy_console");

    await page.locator("[data-testid='pharmacy-case-PHC-2081']").click();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2081");
    await expectAttribute(root, "data-selected-case-id", "PHC-2081");

    await page.locator("[data-testid='pharmacy-checkpoint-inventory']").click();
    await page.locator("[data-testid='pharmacy-line-item-PHC-2081-L2']").click();
    await expectAttribute(root, "data-selected-line-item-id", "PHC-2081-L2");

    await page.locator("[data-testid='pharmacy-route-button-inventory']").click();
    await page.locator("[data-testid='pharmacy-inventory-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2081/inventory");
    await page.locator("[data-testid='pharmacy-return-button']").click();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2081");
    await expectAttribute(root, "data-selected-line-item-id", "PHC-2081-L2");

    await page.locator("[data-testid='pharmacy-case-PHC-2072']").click();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2072");
    await expectAttribute(root, "data-selected-case-id", "PHC-2072");
    await page.locator("[data-testid='pharmacy-route-button-handoff']").click();
    await page.locator("[data-testid='pharmacy-handoff-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2072/handoff");
    await expectAttribute(root, "data-recovery-posture", "read_only");
    await page.locator("[data-testid='pharmacy-return-button']").click();

    await page.locator("[data-testid='pharmacy-case-PHC-2124']").click();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2124");
    await expectAttribute(root, "data-selected-case-id", "PHC-2124");
    await page.locator("[data-testid='pharmacy-route-button-resolve']").click();
    await page.locator("[data-testid='pharmacy-resolve-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2124/resolve");
    await expectAttribute(root, "data-visualization-mode", "table_only");
    await page.locator("[data-testid='pharmacy-return-button']").click();

    await page.locator("[data-testid='pharmacy-case-PHC-2103']").click();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2103");
    await expectAttribute(root, "data-selected-case-id", "PHC-2103");
    await page.locator("[data-testid='pharmacy-route-button-assurance']").click();
    await page.locator("[data-testid='pharmacy-assurance-route']").waitFor();
    await expectAttribute(root, "data-current-path", "/workspace/pharmacy/PHC-2103/assurance");
    await expectAttribute(root, "data-recovery-posture", "recovery_only");

    const focusRestoreMarker = page.locator("[data-testid='pharmacy-focus-restore-marker']");
    await assertHidden(page, "[data-testid='pharmacy-focus-restore-marker']");

    assertCondition(
      (await telemetryCount(page)) === 0,
      "Telemetry log is visible on the default pharmacy route.",
    );
    await page.goto(`${APP_URL}/workspace/pharmacy?diagnostics=pharmacy`, {
      waitUntil: "networkidle",
    });
    assertCondition(
      (await telemetryCount(page)) > 0,
      "Diagnostics telemetry did not render behind the pharmacy flag.",
    );
    await focusRestoreMarker.waitFor();
    await expectAttribute(focusRestoreMarker, "data-dom-marker", "focus-restore");

    await page.setViewportSize({ width: 720, height: 1280 });
    await page.waitForTimeout(150);
    await expectAttribute(root, "data-layout-mode", "mission_stack");
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
    await reducedPage.goto(`${APP_URL}/workspace/pharmacy`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='pharmacy-case-PHC-2057']")
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
    await stopPharmacyConsole(child);
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
