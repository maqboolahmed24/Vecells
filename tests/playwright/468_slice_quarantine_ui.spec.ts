import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  load468Evidence,
  waitForResilienceSurfaces,
  withResilienceBrowser,
  writeAccessibilitySnapshot,
} from "./468_resilience.helpers";

export async function run(): Promise<void> {
  const evidence = load468Evidence();
  assert.equal(evidence.coverage.projectionRebuildMismatchAndSliceBoundedQuarantine, true);
  assert.equal(evidence.gapClosures.globalQuarantineGap, true);

  await withResilienceBrowser("468-slice-quarantine-ui", async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/resilience?state=quarantined`, {
      waitUntil: "networkidle",
    });
    await waitForResilienceSurfaces(page);
    const board = page.locator("[data-surface='resilience-board']");
    await expectAttribute(board, "data-resilience-state", "blocked");
    await expectAttribute(board, "data-binding-state", "blocked");
    await expectAttribute(board, "data-settlement-result", "blocked_guardrail");
    await expectAttribute(board, "data-artifact-state", "summary_only");
    assert.equal(
      await page.locator("[data-surface='recovery-action-rail'] button:not(:disabled)").count(),
      0,
      "Quarantined slice should not expose live controls.",
    );
    assert.equal(
      await page
        .locator("[data-surface='dependency-restore-bands'] button[data-current-authority='current_tuple']")
        .count(),
      9,
      "Quarantine should leave unaffected dependency rows current.",
    );
    assert.equal(
      await page
        .locator("[data-surface='dependency-restore-bands'] button[data-status='blocked']")
        .count(),
      1,
      "Only selected resilience slice should be blocked in the dependency graph.",
    );
    await page.locator("[data-testid='resilience-function-outbound_communications']").focus();
    await page.keyboard.press("Enter");
    await expectAttribute(board, "data-selected-function", "outbound_communications");
    assert.equal(
      await page
        .locator("[data-surface='dependency-restore-bands'] button[data-current-authority='current_tuple']")
        .count(),
      9,
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "468-slice-quarantine-ui.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/resilience?state=freeze`, { waitUntil: "networkidle" });
    await waitForResilienceSurfaces(page);
    await expectAttribute(board, "data-binding-state", "recovery_only");
    await expectAttribute(board, "data-artifact-state", "recovery_only");
    assert.equal(
      await page.locator("[data-surface='recovery-action-rail'] button[data-action-allowed='true']").count(),
      4,
      "Recovery-only state should keep only governed recovery controls.",
    );

    const aria = await writeAccessibilitySnapshot(page, "468-slice-quarantine.aria.yml");
    assert(aria.includes("Resilience Board"), "ARIA snapshot lost Resilience Board.");
    assert(aria.includes("Dependency restore bands"), "ARIA snapshot lost dependency graph.");
    assertNoSensitiveSnapshot(aria, "slice quarantine");
    await assertNoSensitiveText(page.locator("body"), "slice quarantine");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
