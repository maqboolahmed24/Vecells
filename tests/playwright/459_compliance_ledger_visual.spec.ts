import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsCompliancePage,
} from "./459_compliance_ledger.helpers";

export async function runComplianceLedgerVisualSuite() {
  await withOpsCompliancePage(async (page) => {
    for (const [state, fileName, verdict] of [
      ["exact", "compliance-ledger-exact.png", "complete"],
      ["stale", "compliance-ledger-stale.png", "stale"],
      ["blocked", "compliance-ledger-blocked.png", "blocked"],
      ["empty", "compliance-ledger-empty.png", "complete"],
      ["permission-denied", "compliance-ledger-permission-denied.png", "blocked"],
      ["overdue-owner", "compliance-ledger-overdue-owner.png", "stale"],
    ] as const) {
      await page.goto(`${APP_URL}/ops/assurance?state=${state}`, { waitUntil: "networkidle" });
      const ledger = page.locator("[data-testid='compliance-ledger-panel']");
      await ledger.waitFor();
      await expectAttribute(ledger, "data-graph-verdict", verdict);
      await assertNoRawArtifactUrls(page);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, fileName),
        fullPage: true,
      });
    }
  });

  await withOpsCompliancePage(
    async (page) => {
      await page.goto(`${APP_URL}/ops/assurance?state=exact`, { waitUntil: "networkidle" });
      const root = page.locator("[data-testid='ops-shell-root']");
      const ledger = page.locator("[data-testid='compliance-ledger-panel']");
      await root.waitFor();
      await ledger.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(root, "data-reduced-motion", "respect");
      const box = await ledger.boundingBox();
      assert(box && box.width > 320 && box.height > 400, "mission stack ledger should be visible");
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "compliance-ledger-mobile-reduced-motion.png"),
        fullPage: true,
      });
    },
    { viewport: { width: 820, height: 1100 }, reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  await runComplianceLedgerVisualSuite();
}
