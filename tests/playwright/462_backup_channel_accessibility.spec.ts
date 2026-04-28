import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  expectAttribute,
  withBackupRestoreBrowser,
  writeAccessibilitySnapshot,
} from "./462_backup_restore.helpers";

export async function runBackupChannelAccessibilitySuite() {
  await withBackupRestoreBrowser(
    async (page) => {
      await page.goto(`${GOVERNANCE_APP_URL}/ops/config/backup-restore?backupState=target_creation`, {
        waitUntil: "networkidle",
      });
      const root = page.locator("[data-testid='governance-shell-root']");
      const surface = page.locator("[data-testid='backup-restore-config-surface']");
      await root.waitFor();
      await surface.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(surface, "data-target-verification-state", "pending_creation");

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const activeTestId = await page.evaluate(() =>
        document.activeElement?.getAttribute("data-testid"),
      );
      assert(activeTestId, "keyboard tab order should land on a testable control");

      await page.locator("[data-testid='backup-target-row-outbound_communications']").click();
      await expectAttribute(surface, "data-selected-dataset-scope", "outbound_communications");
      await page.setViewportSize({ width: 760, height: 1040 });
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(surface, "data-selected-dataset-scope", "outbound_communications");

      await page.locator("[data-testid='backup-restore-fixture-state']").selectOption("missing_secret");
      await page.locator("[data-testid='backup-target-verify-action']").click();
      const errorSummary = page.locator("[data-testid='backup-restore-error-summary']");
      await errorSummary.waitFor();
      await expectAttribute(surface, "data-target-verification-state", "missing_secret");
      assert(
        (await errorSummary.innerText()).includes("backup target vault reference"),
        "error summary should announce the field-specific problem",
      );

      const snapshot = await writeAccessibilitySnapshot(page, "backup-restore-accessibility.json");
      assert(snapshot.includes("Backup") || snapshot.includes("backup"));
      assert(snapshot.includes("There is a problem"));

      const serializedDom = await page
        .locator("[data-testid='backup-restore-config-surface']")
        .evaluate((node: HTMLElement) => node.textContent);
      assert(!String(serializedDom).match(/https?:\/\//), "accessibility surface must not expose raw URLs");

      await page.screenshot({
        path: path.join(OUTPUT_DIR, "backup-restore-accessibility-mobile.png"),
        fullPage: true,
      });

      await page.goto(`${OPS_APP_URL}/ops/resilience?backupState=stale_checksum`, {
        waitUntil: "networkidle",
      });
      const opsRoot = page.locator("[data-testid='ops-shell-root']");
      const readiness = page.locator("[data-testid='ops-backup-restore-readiness-strip']");
      await opsRoot.waitFor();
      await readiness.waitFor();
      await expectAttribute(opsRoot, "data-layout-mode", "mission_stack");
      await expectAttribute(readiness, "data-readiness-state", "stale");
      await expectAttribute(readiness, "data-recovery-control-state", "blocked");
    },
    { viewport: { width: 820, height: 1120 }, reducedMotion: true },
  );
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("462_backup_channel_accessibility.spec.ts")
) {
  await runBackupChannelAccessibilitySuite();
}
