import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsCompliancePage,
  writeAccessibilitySnapshot,
} from "./459_compliance_ledger.helpers";

export async function runComplianceLedgerAccessibilitySuite() {
  await withOpsCompliancePage(async (page) => {
    await page.goto(`${APP_URL}/ops/assurance?state=stale`, { waitUntil: "networkidle" });
    const ledger = page.locator("[data-testid='compliance-ledger-panel']");
    await ledger.waitFor();
    await expectAttribute(ledger, "data-graph-verdict", "stale");
    await expectAttribute(
      page.locator("[data-testid='graph-completeness-blocker-card']"),
      "data-graph-verdict",
      "stale",
    );

    const captionText = await page
      .locator("[data-testid='compliance-ledger-panel'] caption")
      .first()
      .innerText();
    assert(captionText.includes("Compliance ledger"), "ledger table should expose a caption");
    await page.locator("[data-testid='control-status-ledger-row-dtac_core']").focus();
    await page.keyboard.press("Space");
    await expectAttribute(ledger, "data-selected-control", "dtac:core");

    const snapshot = await writeAccessibilitySnapshot(page, "compliance-ledger-stale-aria.json");
    assert(
      snapshot.includes("Compliance Ledger Panel"),
      "ARIA snapshot should include ledger panel",
    );
    assert(
      snapshot.includes("Control Evidence Gap Queue"),
      "ARIA snapshot should include gap queue",
    );
    assert(
      snapshot.includes("Evidence gap resolution drawer"),
      "ARIA snapshot should include drawer",
    );
    await assertNoRawArtifactUrls(page);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "compliance-ledger-stale-accessibility.png"),
      fullPage: true,
    });
  });

  await withOpsCompliancePage(
    async (page) => {
      await page.goto(`${APP_URL}/ops/assurance?state=permission-denied`, {
        waitUntil: "networkidle",
      });
      const ledger = page.locator("[data-testid='compliance-ledger-panel']");
      await ledger.waitFor();
      await expectAttribute(ledger, "data-action-control-state", "metadata_only");
      await writeAccessibilitySnapshot(page, "compliance-ledger-permission-denied-aria.json");
      await assertNoRawArtifactUrls(page);
    },
    { reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  await runComplianceLedgerAccessibilitySuite();
}
