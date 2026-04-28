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
const APP_URL = "http://127.0.0.1:4318";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "tenant-governance-457");

const scenarioCases = [
  ["normal", "normal", "live", "review_required", "current"],
  ["empty", "empty", "live", "review_required", "empty"],
  ["stale", "stale", "revalidation_required", "revalidation_required", "stale"],
  ["degraded", "degraded", "review_only", "review_required", "current"],
  ["blocked", "blocked", "blocked", "blocked", "blocked"],
  ["permission-denied", "permission_denied", "blocked", "metadata_only", "metadata_only"],
  ["settlement-pending", "settlement_pending", "review_only", "settlement_pending", "current"],
];

async function startGovernanceConsole() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4318", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/governance/tenants`, 25_000);
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

    await page.goto(`${APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const tenant = page.locator("[data-surface='tenant-governance']");
    await root.waitFor();
    await tenant.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/governance/tenants");
    await expectAttribute(tenant, "data-route-mode", "governance_tenants");
    await expectAttribute(tenant, "data-binding-state", "live");
    await expectAttribute(tenant, "data-action-control-state", "review_required");
    await expectAttribute(tenant, "data-watchlist-state", "current");

    for (const surface of [
      "tenant-baseline-matrix",
      "config-diff-viewer",
      "policy-pack-history",
      "standards-watchlist",
      "legacy-reference-findings",
      "promotion-approval-status",
      "release-watch-status",
      "migration-posture",
    ]) {
      await page.locator(`[data-surface='${surface}']`).waitFor();
    }
    assert(
      (await page.locator("[data-surface='tenant-baseline-matrix'] tbody tr").count()) >= 3,
      "tenant baseline matrix should render tenant rows",
    );
    const matrixText = await page.locator("[data-surface='tenant-baseline-matrix']").innerText();
    assert(matrixText.includes("North River ICS"), "matrix should include selected tenant");
    assert(
      /Visibility\/access\s+policy/i.test(matrixText),
      "matrix should include visibility/access domain",
    );
    assert(
      /Migration\/backfill\s+posture/i.test(matrixText),
      "matrix should include migration/backfill domain",
    );

    await page.locator("[data-testid='tenant-row-tenant_harbour_west']").click();
    await expectAttribute(tenant, "data-selected-tenant", "tenant:harbour-west");
    await page.locator("[data-testid='tenant-filter-blocked']").click();
    await page.locator("[data-filter-preserved='true']").waitFor();
    await expectAttribute(
      page.locator("[data-filter-preserved='true']").first(),
      "data-selected",
      "true",
    );

    await page.locator("[data-testid='tenant-filter-all']").click();
    await page
      .locator("[data-testid='tenant-matrix-cell-tenant_demo_gp-pharmacy_overrides']")
      .click();
    await expectAttribute(tenant, "data-selected-domain", "pharmacy_overrides");
    const diffText = await page.locator("[data-surface='config-diff-viewer']").innerText();
    assert(
      diffText.includes("Pharmacy overrides"),
      "diff viewer should follow selected matrix cell",
    );
    assert(diffText.includes("Baseline/live"), "diff viewer should expose baseline/live column");
    assert(diffText.includes("Candidate"), "diff viewer should expose candidate column");
    assert(
      diffText.includes("Impact/evidence"),
      "diff viewer should expose impact/evidence column",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "tenant-governance-normal-desktop.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='tenant-watchlist-finding-pca_448_da6737c9ef9e161c']").click();
    const selectedFinding = await page
      .locator("[data-testid='tenant-selected-finding']")
      .innerText();
    assert(
      selectedFinding.includes("gas_457"),
      "finding actions should expose governed settlement",
    );

    await expectAttribute(
      page.locator("[data-testid='tenant-action-compile_candidate']"),
      "data-action-allowed",
      "false",
    );
    await expectAttribute(
      page.locator("[data-testid='tenant-action-promote_bundle']"),
      "data-action-allowed",
      "false",
    );
    await expectAttribute(
      page.locator("[data-testid='tenant-action-approve_exception']"),
      "data-action-allowed",
      "true",
    );

    await page.locator("[data-testid='tenant-route-ops_config_tenants']").click();
    await page.waitForURL(`${APP_URL}/ops/config/tenants`);
    await expectAttribute(root, "data-current-path", "/ops/config/tenants");
    await expectAttribute(tenant, "data-route-mode", "config_tenants");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "tenant-governance-config-tenants.png"),
      fullPage: true,
    });

    for (const [
      queryState,
      expectedState,
      bindingState,
      actionState,
      watchlistState,
    ] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/governance/tenants?state=${queryState}`, {
        waitUntil: "networkidle",
      });
      await root.waitFor();
      await tenant.waitFor();
      await expectAttribute(tenant, "data-scenario-state", expectedState);
      await expectAttribute(tenant, "data-binding-state", bindingState);
      await expectAttribute(tenant, "data-action-control-state", actionState);
      await expectAttribute(tenant, "data-watchlist-state", watchlistState);
      await expectAttribute(
        page.locator("[data-testid='tenant-action-compile_candidate']"),
        "data-action-allowed",
        "false",
      );
      await expectAttribute(
        page.locator("[data-testid='tenant-action-promote_bundle']"),
        "data-action-allowed",
        "false",
      );
      const bodyText = await tenant.innerText();
      if (expectedState === "empty") {
        assert(bodyText.includes("No tenant baselines"), "empty state should be visible");
      }
      if (expectedState === "blocked") {
        assert(
          bodyText.includes("ser_448_f2ab81680b2e482b"),
          "blocked state should expose standards exception",
        );
        assert(
          bodyText.includes("lrf_448_37fad05f1db76880"),
          "blocked state should expose legacy reference",
        );
      }
      if (expectedState === "stale") {
        await expectAttribute(
          page.locator("[data-testid='tenant-action-revalidate_watchlist']"),
          "data-action-allowed",
          "true",
        );
      }
      if (expectedState === "permission_denied") {
        assert(bodyText.includes("metadata-only"), "permission denied should be metadata-only");
      }
      if (expectedState === "settlement_pending") {
        await expectAttribute(
          page.locator("[data-testid='release-watch-status']"),
          "data-wave-settlement-state",
          "pending",
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `tenant-governance-${expectedState}.png`),
        fullPage: true,
      });
    }

    await page.goto(`${APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await tenant.waitFor();

    const ariaSnapshot = await writeAccessibilitySnapshot(page, "tenant-governance-aria.json");
    assert(ariaSnapshot.includes("Tenant governance"));
    assert(ariaSnapshot.includes("Tenant baseline matrix"));
    assert(ariaSnapshot.includes("Standards dependency watchlist"));

    const reducedContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    const transitionDuration = await reducedPage
      .locator(".tenant-surface")
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
      path: path.join(OUTPUT_DIR, "tenant-governance-reduced-motion.png"),
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
      await page.goto(`${APP_URL}/ops/governance/tenants?state=normal`, {
        waitUntil: "networkidle",
      });
      await tenant.waitFor();
      if (name === "narrow") {
        await expectAttribute(root, "data-layout-mode", "mission_stack");
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `tenant-governance-${name}.png`),
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
