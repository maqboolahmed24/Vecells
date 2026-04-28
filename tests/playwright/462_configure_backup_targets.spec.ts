import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  assertRedactedBackupPayload,
  assertRedactedRestorePayload,
  expectAttribute,
  withBackupRestoreBrowser,
} from "./462_backup_restore.helpers";

export async function runConfigureBackupTargetsSuite() {
  await withBackupRestoreBrowser(async (page) => {
    const backupPayloads: Record<string, unknown>[] = [];
    const reportPayloads: Record<string, unknown>[] = [];
    await page.route("**/phase9/fake-backup-target", async (route: any) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedBackupPayload(payload);
      backupPayloads.push(payload);
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ accepted: true, targetRecordId: `target-${backupPayloads.length}` }),
      });
    });
    await page.route("**/phase9/fake-restore-report-receiver", async (route: any) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedRestorePayload(payload);
      reportPayloads.push(payload);
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ accepted: true, receiverRecordId: `report-${reportPayloads.length}` }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/backup-restore?backupState=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const surface = page.locator("[data-testid='backup-restore-config-surface']");
    await root.waitFor();
    await surface.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/config/backup-restore");
    await expectAttribute(surface, "data-visual-mode", "Backup_Restore_Channel_Control_Ledger");
    await expectAttribute(surface, "data-scenario-state", "normal");
    await expectAttribute(surface, "data-target-verification-state", "verified");
    await expectAttribute(surface, "data-report-delivery-state", "delivered");

    await page.locator("[data-testid='backup-restore-tenant-select']").selectOption("tenant-assurance-lab");
    await page.locator("[data-testid='backup-restore-environment-select']").selectOption("preview");
    await page
      .locator("[data-testid='backup-restore-release-select']")
      .selectOption("release-recovery-green-17");
    await page
      .locator("[data-testid='backup-essential-function-select']")
      .selectOption("safety_gate_triage_queue");
    await page.locator("[data-testid='backup-target-secret-ref-input']").focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(
      "vault-ref/tenant-assurance-lab/preview/backup-targets/safety-gate-triage-queue/v1",
    );
    await page.locator("[data-testid='restore-channel-secret-ref-input']").focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(
      "vault-ref/tenant-assurance-lab/preview/restore-report-channels/restore-channel-resilience-board/v1",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expectAttribute(surface, "data-target-verification-state", "verified");
    assert.equal(backupPayloads.length, 1, "fake target should receive one verification call");
    assert.equal(backupPayloads[0]?.datasetScope, "safety_gate_triage_queue");
    assert.equal(backupPayloads[0]?.tenantRef, "tenant-assurance-lab");
    assert.equal(backupPayloads[0]?.environmentRef, "preview");

    await page.locator("[data-testid='restore-channel-test-delivery-action']").click();
    await expectAttribute(surface, "data-report-delivery-state", "delivered");
    assert.equal(reportPayloads.length, 1, "fake report receiver should receive one delivery call");
    assert.equal(reportPayloads[0]?.artifactType, "restore_report");
    assert.equal(reportPayloads[0]?.tenantRef, "tenant-assurance-lab");

    const liveRegion = page.locator("[data-testid='backup-restore-live']");
    const startedAt = Date.now();
    while (Date.now() - startedAt < 3_000) {
      if ((await liveRegion.innerText()).includes("Restore report delivery settled")) {
        break;
      }
      await page.waitForTimeout(50);
    }
    assert(
      (await liveRegion.innerText()).includes("Restore report delivery settled"),
      "aria-live message should settle after restore report delivery",
    );

    await page.locator("[data-testid='backup-target-row-assistive_downgrade_human_artifact']").click();
    await expectAttribute(
      surface,
      "data-selected-dataset-scope",
      "assistive_downgrade_human_artifact",
    );
    await expectAttribute(
      page.locator("[data-testid='recovery-artifact-policy-rail']"),
      "data-no-raw-artifact-urls",
      "true",
    );

    const bodyText = await page.locator("body").evaluate((body: HTMLElement) => body.textContent);
    assert(!String(bodyText).match(/https?:\/\//), "config UI must not expose raw endpoints");
    assert(!String(bodyText).match(/sk_live|Bearer|access_token|BEGIN PRIVATE/));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "backup-restore-config-normal.png"),
      fullPage: true,
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "backup-restore-observed-payloads.json"),
      `${JSON.stringify({ backupPayloads, reportPayloads }, null, 2)}\n`,
    );

    await page.goto(`${OPS_APP_URL}/ops/resilience?backupState=normal`, { waitUntil: "networkidle" });
    const opsRoot = page.locator("[data-testid='ops-shell-root']");
    const readiness = page.locator("[data-testid='ops-backup-restore-readiness-strip']");
    await opsRoot.waitFor();
    await readiness.waitFor();
    await expectAttribute(opsRoot, "data-backup-restore-state", "normal");
    await expectAttribute(readiness, "data-readiness-state", "ready");
    await expectAttribute(readiness, "data-recovery-control-state", "live_control");
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("462_configure_backup_targets.spec.ts")
) {
  await runConfigureBackupTargetsSuite();
}
