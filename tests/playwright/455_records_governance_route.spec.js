import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "governance-console");
const APP_URL = "http://127.0.0.1:4315";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "records-governance-455");

const scenarioCases = [
  ["normal", "normal", "live", "live_review", "external_handoff_ready", "complete"],
  ["empty", "empty", "live", "live_review", "summary_only", "complete"],
  ["stale", "stale", "revalidation_required", "revalidation_required", "governed_preview", "stale"],
  ["degraded", "degraded", "review_only", "revalidation_required", "governed_preview", "partial"],
  ["blocked", "blocked", "blocked", "blocked", "summary_only", "blocked"],
  ["permission-denied", "permission_denied", "blocked", "blocked", "summary_only", "blocked"],
  [
    "settlement-pending",
    "settlement_pending",
    "review_only",
    "settlement_pending",
    "governed_preview",
    "partial",
  ],
];

async function startGovernanceConsole() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4315", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/governance/records`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`governance-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopGovernanceConsole(child) {
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
    if (value === expected) return;
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

  const { child } = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const records = page.locator("[data-surface='records-governance']");
    await root.waitFor();
    await records.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/governance/records");
    await expectAttribute(records, "data-route-mode", "records");
    await expectAttribute(records, "data-binding-state", "live");
    await expectAttribute(records, "data-action-control-state", "live_review");
    await expectAttribute(records, "data-graph-state", "complete");

    for (const surface of [
      "retention-class-browser",
      "lifecycle-ledger",
      "legal-hold-queue",
      "hold-scope-review",
      "disposition-queue",
      "block-explainer",
      "deletion-certificate-stage",
      "archive-manifest-stage",
    ]) {
      await page.locator(`[data-surface='${surface}']`).waitFor();
    }
    assert(
      (await page.locator("[data-surface='lifecycle-ledger'] tbody tr").count()) >= 4,
      "lifecycle ledger should render current rows",
    );
    const ledgerText = await page.locator("[data-surface='lifecycle-ledger']").innerText();
    assert(ledgerText.includes("rlb_442"), "ledger should expose RetentionLifecycleBinding refs");
    assert(ledgerText.includes("rd_442"), "ledger should expose RetentionDecision refs");
    assert(
      ledgerText.includes("dea_442"),
      "ledger should expose DispositionEligibilityAssessment refs",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "records-governance-normal-desktop.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='records-route-ops_governance_records_holds']").click();
    await expectAttribute(root, "data-current-path", "/ops/governance/records/holds");
    await expectAttribute(records, "data-route-mode", "holds");
    const holdReview = await page.locator("[data-surface='hold-scope-review']").innerText();
    assert(holdReview.includes("scopehashh09"));
    assert(holdReview.includes("freezescopeh09"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "records-governance-holds.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='records-route-ops_governance_records_disposition']").click();
    await expectAttribute(root, "data-current-path", "/ops/governance/records/disposition");
    await expectAttribute(records, "data-route-mode", "disposition");
    const dispositionText = await page.locator("[data-surface='disposition-queue']").innerText();
    assert(dispositionText.includes("current_assessment"));
    assert(!dispositionText.includes("raw_storage_scan"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "records-governance-disposition.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='governance-object-records-freeze-archive-14']").click();
    await expectAttribute(records, "data-selected-artifact", "artifact:audit-ledger-worm-014");
    const deleteButton = page.locator("[data-testid='records-action-approve_deletion_job']");
    await expectAttribute(deleteButton, "data-action-allowed", "false");
    const selectedSummary = await page
      .locator("[data-testid='records-selected-summary']")
      .innerText();
    assert(selectedSummary.includes("suppressed"), "WORM row should suppress delete controls");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "records-governance-worm-suppressed.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='governance-object-records-hold-09']").click();
    const releaseHoldButton = page.locator("[data-testid='records-action-release_legal_hold']");
    await releaseHoldButton.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(releaseHoldButton, "data-settlement-state", "ready");

    for (const [
      queryState,
      expectedState,
      bindingState,
      actionState,
      artifactState,
      graphState,
    ] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/governance/records?state=${queryState}`, {
        waitUntil: "networkidle",
      });
      await root.waitFor();
      await records.waitFor();
      await expectAttribute(records, "data-scenario-state", expectedState);
      await expectAttribute(records, "data-binding-state", bindingState);
      await expectAttribute(records, "data-action-control-state", actionState);
      await expectAttribute(records, "data-artifact-state", artifactState);
      await expectAttribute(records, "data-graph-state", graphState);
      if (expectedState === "stale") {
        await expectAttribute(
          page.locator("[data-testid='records-action-approve_archive_job']"),
          "data-action-allowed",
          "false",
        );
      }
      if (expectedState === "settlement_pending") {
        const holdText = await page.locator("[data-surface='hold-scope-review']").innerText();
        assert(holdText.includes("released_needs_assessment") || holdText.includes("current"));
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `records-governance-${expectedState}.png`),
        fullPage: true,
      });
    }

    await page.goto(`${APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await records.waitFor();

    const ariaSnapshot = await writeAccessibilitySnapshot(page, "records-governance-aria.json");
    assert(ariaSnapshot.includes("Records governance"));
    assert(ariaSnapshot.includes("Lifecycle ledger"));
    assert(ariaSnapshot.includes("Disposition queue"));

    const reducedContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    const transitionDuration = await reducedPage
      .locator(".records-surface")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    assert(
      transitionDuration === "0.01ms" ||
        transitionDuration === "0.00001s" ||
        transitionDuration === "1e-05s" ||
        transitionDuration === "0s",
      `Reduced motion should collapse transitions, found ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "records-governance-reduced-motion.png"),
      fullPage: true,
    });
    await reducedContext.close();

    for (const [name, width, height] of [
      ["desktop", 1440, 1100],
      ["laptop", 1280, 900],
      ["tablet", 900, 1100],
      ["narrow", 390, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${APP_URL}/ops/governance/records?state=normal`, {
        waitUntil: "networkidle",
      });
      await records.waitFor();
      if (name === "narrow") {
        await expectAttribute(root, "data-layout-mode", "mission_stack");
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `records-governance-${name}.png`),
        fullPage: true,
      });
    }

    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
  } finally {
    await browser.close();
    await stopGovernanceConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
