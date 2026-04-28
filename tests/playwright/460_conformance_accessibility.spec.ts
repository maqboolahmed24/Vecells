import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsConformancePage,
  writeAccessibilitySnapshot,
} from "./460_conformance_scorecard.helpers";

export async function runConformanceAccessibilitySuite() {
  await withOpsConformancePage(async (page) => {
    await page.goto(`${APP_URL}/ops/conformance?state=stale`, { waitUntil: "networkidle" });
    const shell = page.locator("[data-testid='conformance-scorecard-shell']");
    await shell.waitFor();
    await expectAttribute(shell, "data-scorecard-state", "stale");
    await expectAttribute(shell, "data-bau-action-state", "diagnostic_only");

    const captions = await page
      .locator("[data-testid='conformance-scorecard-shell'] caption")
      .allInnerTexts();
    assert(
      captions.some((caption) => caption.includes("Cross-phase conformance proof rows")),
      "phase proof table should expose a caption",
    );
    assert(
      captions.some((caption) => caption.includes("Shared control families")),
      "matrix table should expose a caption",
    );

    await page.locator("[data-surface='phase-row-proof-table'] tbody tr").first().focus();
    await page.keyboard.press("Space");
    const selectedRowRef = await shell.getAttribute("data-selected-row-ref");
    await expectAttribute(
      page.locator("[data-testid='conformance-source-trace-drawer']"),
      "data-selected-row-ref",
      selectedRowRef ?? "",
    );

    const action = page.locator("[data-testid='bau-signoff-primary-action']");
    const ariaDescribedBy = await action.getAttribute("aria-describedby");
    assert.equal(ariaDescribedBy, "bau-signoff-disabled-reason");

    const snapshot = await writeAccessibilitySnapshot(
      page,
      "conformance-scorecard-stale-aria.json",
    );
    assert(
      snapshot.includes("Cross-Phase Conformance Scorecard"),
      "ARIA snapshot should include scorecard shell",
    );
    assert(
      snapshot.includes("BAU signoff blocker queue"),
      "ARIA snapshot should include blocker queue",
    );
    assert(
      snapshot.includes("Conformance source trace drawer"),
      "ARIA snapshot should include source trace drawer",
    );
    await assertNoRawArtifactUrls(page);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "conformance-scorecard-stale-accessibility.png"),
      fullPage: true,
    });
  });

  await withOpsConformancePage(
    async (page) => {
      await page.goto(`${APP_URL}/ops/conformance?state=permission-denied`, {
        waitUntil: "networkidle",
      });
      const shell = page.locator("[data-testid='conformance-scorecard-shell']");
      await shell.waitFor();
      await expectAttribute(shell, "data-bau-action-state", "permission_denied");
      await expectAttribute(
        page.locator("[data-testid='bau-signoff-primary-action']"),
        "data-action-allowed",
        "false",
      );
      await writeAccessibilitySnapshot(page, "conformance-scorecard-permission-denied-aria.json");
      await assertNoRawArtifactUrls(page);
    },
    { reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  await runConformanceAccessibilitySuite();
}
