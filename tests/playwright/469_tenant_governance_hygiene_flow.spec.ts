import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveScreenshot,
  assertNoSensitiveText,
  expectAttribute,
  load469Evidence,
  waitForTenantSurfaces,
  withTenantGovernanceBrowser,
} from "./469_incident_tenant.helpers";

function screenshotPath(name: string): string {
  return path.join(OUTPUT_DIR, name);
}

export async function run(): Promise<void> {
  const evidence = load469Evidence();
  assert.equal(evidence.coverage.immutableConfigVersioning, true);
  assert.equal(evidence.coverage.standardsWatchlistHashParity, true);
  assert.equal(evidence.coverage.dependencyLifecycleHygiene, true);
  assert.equal(evidence.gapClosures.configShortcutGap, true);
  assert.equal(evidence.gapClosures.exceptionPermanenceGap, true);

  await withTenantGovernanceBrowser("469-tenant-governance-hygiene-flow", async (page) => {
    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);

    const root = page.locator("[data-testid='governance-shell-root']");
    const tenant = page.locator("[data-surface='tenant-governance']");
    await expectAttribute(root, "data-current-path", "/ops/governance/tenants");
    await expectAttribute(tenant, "data-route-mode", "governance_tenants");
    await expectAttribute(tenant, "data-binding-state", "live");
    await expectAttribute(tenant, "data-action-control-state", "review_required");
    await expectAttribute(tenant, "data-watchlist-state", "current");
    assert(
      (await page.locator("[data-surface='tenant-baseline-matrix'] tbody tr").count()) >= 3,
      "Tenant baseline matrix should expose multiple tenant rows.",
    );
    assert(
      (await page.locator("[data-surface='policy-pack-history'] tbody tr").count()) >= 14,
      "Policy pack history should expose every required pack family.",
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

    await page.locator("[data-testid='tenant-filter-blocked']").click();
    await page.locator("[data-filter-preserved='true']").waitFor();
    await page.locator("[data-testid='tenant-filter-all']").click();
    await page
      .locator("[data-testid='tenant-matrix-cell-tenant_demo_gp-pharmacy_overrides']")
      .click();
    await expectAttribute(tenant, "data-selected-domain", "pharmacy_overrides");
    const diffText = await page.locator("[data-surface='config-diff-viewer']").innerText();
    assert(diffText.includes("Pharmacy overrides"), "Config diff should track selected domain.");
    assert(diffText.includes("Baseline/live"), "Config diff should include baseline/live value.");
    assert(diffText.includes("Candidate"), "Config diff should include candidate value.");
    assert(diffText.includes("Impact/evidence"), "Config diff should include evidence impact.");

    await page
      .locator("[data-testid='tenant-watchlist-finding-pca_448_da6737c9ef9e161c']")
      .click();
    const selectedFinding = await page.locator("[data-testid='tenant-selected-finding']").innerText();
    assert(selectedFinding.includes("gas_457"), "Dependency drawer should expose governed action settlement.");
    await assertNoSensitiveText(page.locator("body"), "normal tenant governance");

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=blocked`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);
    await expectAttribute(tenant, "data-scenario-state", "blocked");
    await expectAttribute(tenant, "data-binding-state", "blocked");
    await expectAttribute(
      page.locator("[data-surface='standards-watchlist']"),
      "data-compile-gate-state",
      "blocked",
    );
    await expectAttribute(
      page.locator("[data-surface='standards-watchlist']"),
      "data-promotion-gate-state",
      "blocked",
    );
    await expectAttribute(
      page.locator("[data-testid='tenant-action-compile_candidate']"),
      "data-action-allowed",
      "false",
    );
    const blockedText = await tenant.innerText();
    assert(blockedText.includes("lrf_448_37fad05f1db76880"), "Legacy reference should block compile.");
    assert(blockedText.includes("ser_448_f2ab81680b2e482b"), "Expired exception should remain visible.");
    await assertNoSensitiveText(page.locator("body"), "blocked tenant governance");
    const compileBlocked = screenshotPath("469-compile-blocked.png");
    await page.screenshot({ path: compileBlocked, fullPage: true });
    assertNoSensitiveScreenshot(compileBlocked, "compile-blocked screenshot");

    await page.locator("[data-testid='standards-exceptions']").scrollIntoViewIfNeeded();
    const exceptionText = await page.locator("[data-testid='standards-exceptions']").innerText();
    assert(exceptionText.includes("expired_reopened"), "Expired exception should reopen findings.");
    const exceptionExpired = screenshotPath("469-exception-expired.png");
    await page.screenshot({ path: exceptionExpired, fullPage: true });
    assertNoSensitiveScreenshot(exceptionExpired, "exception-expired screenshot");

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=settlement-pending`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);
    await expectAttribute(tenant, "data-scenario-state", "settlement_pending");
    await expectAttribute(tenant, "data-action-control-state", "settlement_pending");
    await expectAttribute(
      page.locator("[data-testid='promotion-approval-status']"),
      "data-promotion-readiness-state",
      "settlement_pending",
    );
    await expectAttribute(
      page.locator("[data-testid='release-watch-status']"),
      "data-wave-settlement-state",
      "pending",
    );
    const promotionBlocked = screenshotPath("469-promotion-blocked.png");
    await page.screenshot({ path: promotionBlocked, fullPage: true });
    assertNoSensitiveScreenshot(promotionBlocked, "promotion-blocked screenshot");

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForTenantSurfaces(page);
    await expectAttribute(root, "data-current-path", "/ops/governance/tenants");
    await expectAttribute(tenant, "data-route-mode", "governance_tenants");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeElementName = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.innerText ?? "",
    );
    assert(activeElementName.length > 0, "Keyboard focus should expose a named control.");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
