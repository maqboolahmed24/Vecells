import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsConformancePage,
} from "./460_conformance_scorecard.helpers";

export async function runConformanceBlockersSuite() {
  await withOpsConformancePage(async (page) => {
    for (const [state, scorecardState, actionState] of [
      ["summary-drift", "blocked", "blocked"],
      ["missing-verification", "blocked", "blocked"],
      ["stale-runtime-tuple", "blocked", "blocked"],
      ["missing-ops-proof", "blocked", "blocked"],
      ["stale", "stale", "diagnostic_only"],
      ["blocked", "blocked", "blocked"],
      ["permission-denied", "blocked", "permission_denied"],
    ] as const) {
      await page.goto(`${APP_URL}/ops/conformance?state=${state}`, { waitUntil: "networkidle" });
      const shell = page.locator("[data-testid='conformance-scorecard-shell']");
      await shell.waitFor();
      await expectAttribute(shell, "data-scorecard-state", scorecardState);
      await expectAttribute(shell, "data-bau-action-state", actionState);
      const action = page.locator("[data-testid='bau-signoff-primary-action']");
      await expectAttribute(action, "data-action-allowed", "false");
      const reason = await action.getAttribute("data-disabled-reason");
      assert(reason && reason.length > 20, "disabled BAU action should expose a reason");
      await assertNoRawArtifactUrls(page);
    }

    await page.goto(`${APP_URL}/ops/conformance?state=blocked`, { waitUntil: "networkidle" });
    const shell = page.locator("[data-testid='conformance-scorecard-shell']");
    await shell.waitFor();
    const initialBlockerCount = await page.locator("[data-testid^='conformance-blocker-']").count();
    assert(initialBlockerCount > 1, "blocked scenario should expose blocker queue items");

    await page.locator("[data-testid='conformance-filter-owner']").selectOption("operations");
    await page.locator("[data-testid='conformance-filter-blocker']").selectOption("has_blocker");
    await page.locator("[data-testid='conformance-filter-state']").selectOption("blocked");
    const filteredBlockerCount = await page
      .locator("[data-testid^='conformance-blocker-']")
      .count();
    assert(filteredBlockerCount >= 1, "owner/blocker filters should expose operations blockers");

    const firstBlocker = page.locator("[data-testid^='conformance-blocker-']").first();
    const sourceRowRef = await firstBlocker.locator("button").getAttribute("data-source-row-ref");
    await firstBlocker.locator("button").click();
    await expectAttribute(shell, "data-selected-row-ref", sourceRowRef ?? "");
    await expectAttribute(
      page.locator("[data-testid='conformance-source-trace-drawer']"),
      "data-selected-row-ref",
      sourceRowRef ?? "",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "conformance-scorecard-blockers.png"),
      fullPage: true,
    });
  });
}

if (process.argv.includes("--run")) {
  await runConformanceBlockersSuite();
}
