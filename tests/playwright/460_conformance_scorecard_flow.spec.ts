import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsConformancePage,
} from "./460_conformance_scorecard.helpers";

export async function runConformanceScorecardFlowSuite() {
  await withOpsConformancePage(async (page) => {
    await page.goto(`${APP_URL}/ops/conformance?state=exact`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const shell = page.locator("[data-testid='conformance-scorecard-shell']");
    const table = page.locator("[data-testid='phase-row-proof-table']");
    await root.waitFor();
    await shell.waitFor();
    await table.waitFor();

    await expectAttribute(root, "data-current-path", "/ops/conformance");
    await expectAttribute(shell, "data-visual-mode", "Service_Owner_Conformance_Ledger");
    await expectAttribute(shell, "data-scenario-state", "exact");
    await expectAttribute(shell, "data-scorecard-state", "exact");
    await expectAttribute(shell, "data-bau-action-state", "ready");
    assert.equal(
      await page.locator("[data-surface='phase-row-proof-table'] tbody tr").count(),
      5,
      "exact scorecard should expose five canonical task 449 rows",
    );

    await page.locator("[data-testid='phase-row-cross_phase_runtime_release']").click();
    const selectedRowRef = await shell.getAttribute("data-selected-row-ref");
    assert(selectedRowRef, "row selection should set selected row ref");
    await expectAttribute(
      page.locator("[data-testid='conformance-source-trace-drawer']"),
      "data-selected-row-ref",
      selectedRowRef,
    );

    await page.locator("[data-testid='source-trace-drawer-toggle']").click({ force: true });
    await expectAttribute(shell, "data-drawer-state", "closed");
    await page.locator("[data-testid='source-trace-drawer-toggle']").click({ force: true });
    await expectAttribute(shell, "data-drawer-state", "open");
    await expectAttribute(
      page.locator("[data-testid='conformance-source-trace-drawer']"),
      "data-selected-row-ref",
      selectedRowRef,
    );

    await page.locator("[data-testid='conformance-filter-owner']").selectOption("release");
    await page.locator("[data-testid='conformance-filter-blocker']").selectOption("no_blocker");
    await page.locator("[data-testid='conformance-filter-state']").selectOption("exact");
    assert(
      (await page.locator("[data-surface='phase-row-proof-table'] tbody tr").count()) >= 1,
      "owner/blocker/state filters should retain matching exact rows",
    );

    await page
      .locator("[data-testid='conformance-filter-scenario']")
      .selectOption("deferred_channel");
    await expectAttribute(shell, "data-scenario-state", "deferred_channel");
    await page.locator("[data-testid='conformance-filter-owner']").selectOption("all");
    await page.locator("[data-testid='conformance-filter-blocker']").selectOption("all");
    await page.locator("[data-testid='conformance-filter-state']").selectOption("deferred");
    assert.equal(
      await page.locator("[data-row-kind='deferred_channel']").count(),
      1,
      "deferred channel must stay visible as an explicit row",
    );
    await assertNoRawArtifactUrls(page);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "conformance-scorecard-flow-exact-deferred.png"),
      fullPage: true,
    });
  });
}

if (process.argv.includes("--run")) {
  await runConformanceScorecardFlowSuite();
}
