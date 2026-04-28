import assert from "node:assert/strict";
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

export async function runRestoreReportChannelsSuite() {
  await withBackupRestoreBrowser(async (page) => {
    let fakeBackupTargetCalls = 0;
    let fakeReportReceiverCalls = 0;
    await page.route("**/phase9/fake-backup-target", async (route: any) => {
      fakeBackupTargetCalls += 1;
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedBackupPayload(payload);
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ accepted: true }),
      });
    });
    await page.route("**/phase9/fake-restore-report-receiver", async (route: any) => {
      fakeReportReceiverCalls += 1;
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedRestorePayload(payload);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accepted: false, fixtureState: "report_delivery_failed" }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/backup-restore?backupState=missing-secret`, {
      waitUntil: "networkidle",
    });
    const surface = page.locator("[data-testid='backup-restore-config-surface']");
    await surface.waitFor();
    await expectAttribute(surface, "data-scenario-state", "missing_secret");
    await expectAttribute(surface, "data-target-verification-state", "missing_secret");
    await page.locator("[data-testid='backup-target-verify-action']").click();
    const errorSummary = page.locator("[data-testid='backup-restore-error-summary']");
    await errorSummary.waitFor();
    assert(
      (await errorSummary.innerText()).includes("backup target vault reference"),
      "missing backup target secret should be visible",
    );
    assert.equal(fakeBackupTargetCalls, 0, "missing secret must not call fake target");

    await page.locator("[data-testid='backup-target-secret-ref-input']").fill(
      "vault-ref/tenant-demo-gp/local/backup-targets/patient-intake-event-data/v1",
    );
    await page.locator("[data-testid='restore-channel-secret-ref-input']").fill(
      "vault-ref/tenant-demo-gp/local/restore-report-channels/restore-channel-resilience-board/v1",
    );

    await page.locator("[data-testid='backup-restore-fixture-state']").selectOption("stale_checksum");
    await page.locator("[data-testid='backup-target-verify-action']").click();
    await expectAttribute(surface, "data-target-verification-state", "stale_checksum");
    assert(
      (await errorSummary.innerText()).includes("checksum"),
      "stale checksum should require manifest refresh",
    );

    await page
      .locator("[data-testid='backup-restore-fixture-state']")
      .selectOption("missing_immutability_proof");
    await page.locator("[data-testid='backup-target-verify-action']").click();
    await expectAttribute(surface, "data-target-verification-state", "missing_immutability_proof");
    assert(
      (await errorSummary.innerText()).includes("immutability proof"),
      "missing immutability proof should be explicit",
    );

    await page.locator("[data-testid='backup-restore-fixture-state']").selectOption("unsupported_scope");
    await page.locator("[data-testid='backup-target-verify-action']").click();
    await expectAttribute(surface, "data-target-verification-state", "unsupported_scope");
    assert(
      (await errorSummary.innerText()).includes("supported tenant"),
      "unsupported scope should be visible",
    );

    await page.locator("[data-testid='backup-restore-fixture-state']").selectOption("tuple_drift");
    await page.locator("[data-testid='backup-target-verify-action']").click();
    await expectAttribute(surface, "data-target-verification-state", "tuple_drift");
    await expectAttribute(surface, "data-readiness-state", "stale");
    assert(
      (await errorSummary.innerText()).includes("tuple hash"),
      "tuple drift should invalidate live controls",
    );

    await page
      .locator("[data-testid='backup-restore-fixture-state']")
      .selectOption("report_delivery_failed");
    await page.locator("[data-testid='restore-channel-test-delivery-action']").click();
    await expectAttribute(surface, "data-report-delivery-state", "failed");
    assert.equal(fakeReportReceiverCalls, 1, "delivery failure should call only the fake receiver");
    assert(
      (await errorSummary.innerText()).includes("Fake restore report receiver rejected"),
      "delivery failure should retain the fallback disposition",
    );
    await expectAttribute(
      page.locator("[data-testid='backup-restore-readiness-strip']"),
      "data-recovery-control-state",
      "blocked",
    );

    await page.locator("[data-testid='backup-restore-fixture-state']").selectOption("withdrawn_channel");
    await page.locator("[data-testid='restore-channel-test-delivery-action']").click();
    await expectAttribute(surface, "data-report-delivery-state", "withdrawn");
    assert(
      (await errorSummary.innerText()).includes("withdrawn"),
      "withdrawn channel should force human handoff fallback",
    );

    const serializedDom = await page
      .locator("[data-testid='backup-restore-config-surface']")
      .evaluate((node: HTMLElement) => node.textContent);
    assert(!String(serializedDom).match(/https?:\/\//), "surface must not expose raw endpoints");
    assert(!String(serializedDom).match(/sk_live|BEGIN PRIVATE|Bearer|access_token/));
    assert(
      String(serializedDom).includes("vault-ref/"),
      "DOM should expose vault refs rather than inline secret material",
    );

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "backup-restore-failure-states.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/resilience?backupState=tuple_drift`, {
      waitUntil: "networkidle",
    });
    const opsReadiness = page.locator("[data-testid='ops-backup-restore-readiness-strip']");
    await opsReadiness.waitFor();
    await expectAttribute(opsReadiness, "data-tuple-state", "drifted");
    await expectAttribute(opsReadiness, "data-recovery-control-state", "blocked");
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("462_restore_report_channels.spec.ts")
) {
  await runRestoreReportChannelsSuite();
}
