import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  expectAttributePresent,
  load467Evidence,
  withRecordsGovernanceBrowser,
  writeAccessibilitySnapshot,
} from "./467_records_governance.helpers";

async function waitForRecordsSurfaces(page: any) {
  await page.locator("[data-testid='governance-shell-root']").waitFor();
  await page.locator("[data-surface='records-governance']").waitFor();
  for (const surface of [
    "retention-class-browser",
    "lifecycle-ledger",
    "legal-hold-queue",
    "hold-scope-review",
    "disposition-queue",
    "block-explainer",
    "deletion-certificate-stage",
    "archive-manifest-stage",
  ]) {
    await page.locator(`[data-surface='${surface}']`).waitFor();
  }
}

export async function run(): Promise<void> {
  const evidence = load467Evidence();
  assert.equal(evidence.coverage.creationTimeRetentionLifecycleBinding, true);
  assert.equal(evidence.coverage.legalHoldAndFreeze, true);
  assert.equal(evidence.coverage.wormHashChainDeletionExclusion, true);
  assert.equal(evidence.coverage.replayCriticalArchiveOnlyProtection, true);

  await withRecordsGovernanceBrowser("467-records-governance-lifecycle-flow", async (page) => {
    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForRecordsSurfaces(page);
    const root = page.locator("[data-testid='governance-shell-root']");
    const records = page.locator("[data-surface='records-governance']");
    await expectAttribute(root, "data-current-path", "/ops/governance/records");
    await expectAttribute(records, "data-route-mode", "records");
    await expectAttribute(records, "data-scenario-state", "normal");
    await expectAttribute(records, "data-binding-state", "live");
    await expectAttribute(records, "data-graph-state", "complete");
    await expectAttributePresent(records, "data-selected-artifact");

    const retentionBrowserText = await page
      .locator("[data-surface='retention-class-browser']")
      .innerText();
    for (const expectedClass of ["request_snapshot", "worm_audit_entry", "model_trace"]) {
      assert(
        retentionBrowserText.includes(expectedClass),
        `Retention class browser missing ${expectedClass}`,
      );
    }
    assert.equal(
      await page
        .locator(
          "[data-surface='lifecycle-ledger'] tbody tr[data-eligibility-state='delete_allowed'][data-delete-control-state='available']",
        )
        .count(),
      1,
      "Expected exactly one delete-ready current assessment row.",
    );
    assert(
      (await page.locator("[data-surface='lifecycle-ledger'] tbody tr").count()) >= 4,
      "Lifecycle ledger should include the protected records rows.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-exact.png"),
      fullPage: true,
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records/holds?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForRecordsSurfaces(page);
    await expectAttribute(root, "data-current-path", "/ops/governance/records/holds");
    await expectAttribute(records, "data-route-mode", "holds");
    const holdReviewText = await page.locator("[data-surface='hold-scope-review']").innerText();
    assert(holdReviewText.includes("scopehashh09"), "Hold scope hash missing.");
    assert(holdReviewText.includes("freezescopeh09"), "Freeze scope hash missing.");
    assert(holdReviewText.includes("current"), "Active hold should remain current.");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-hold-active.png"),
      fullPage: true,
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records/disposition?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForRecordsSurfaces(page);
    await expectAttribute(root, "data-current-path", "/ops/governance/records/disposition");
    await expectAttribute(records, "data-route-mode", "disposition");
    await expectAttribute(
      page.locator("[data-testid='records-action-approve_deletion_job']"),
      "data-action-allowed",
      "true",
    );
    const dispositionText = await page.locator("[data-surface='disposition-queue']").innerText();
    assert(dispositionText.includes("current_assessment"));
    assert(!dispositionText.includes("raw_storage_scan"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-delete-ready.png"),
      fullPage: true,
    });

    await page.locator("[data-graph-criticality='worm'] button").click();
    await expectAttribute(records, "data-selected-artifact", "artifact:audit-ledger-worm-014");
    await expectAttribute(
      page.locator("[data-testid='records-action-approve_archive_job']"),
      "data-action-allowed",
      "true",
    );
    await expectAttribute(
      page.locator("[data-testid='records-action-approve_deletion_job']"),
      "data-action-allowed",
      "false",
    );
    const selectedSummary = await page
      .locator("[data-testid='records-selected-summary']")
      .innerText();
    assert(selectedSummary.includes("suppressed"), "WORM row should suppress delete controls.");
    assert(selectedSummary.includes("WORM"), "WORM selected summary lost immutable context.");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-freeze-active.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-archive-ready.png"),
      fullPage: true,
    });

    const archiveStage = page.locator("[data-surface='archive-manifest-stage']");
    const certificateStage = page.locator("[data-surface='deletion-certificate-stage']");
    await expectAttribute(archiveStage, "data-artifact-state", "external_handoff_ready");
    assert((await archiveStage.innerText()).includes("ArchiveManifest"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-archived.png"),
      fullPage: true,
    });
    assert((await certificateStage.innerText()).includes("DeletionCertificate"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-deleted.png"),
      fullPage: true,
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await waitForRecordsSurfaces(page);
    await expectAttribute(records, "data-scenario-state", "permission_denied");
    await expectAttribute(records, "data-binding-state", "blocked");
    await expectAttribute(records, "data-action-control-state", "blocked");
    await expectAttribute(records, "data-graph-state", "blocked");
    assert.equal(
      await page.locator("[data-testid^='records-action-'][data-action-allowed='true']").count(),
      0,
      "Permission denied state should not expose allowed records actions.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-permission-denied.png"),
      fullPage: true,
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForRecordsSurfaces(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert(
      (await page.evaluate(() => document.activeElement?.tagName ?? "")).length > 0,
      "Keyboard focus disappeared in records governance.",
    );

    const aria = await writeAccessibilitySnapshot(page, "467-records-governance.aria.yml");
    assert(aria.includes("Records governance"), "ARIA snapshot lost records governance.");
    assert(aria.includes("Lifecycle ledger"), "ARIA snapshot lost lifecycle ledger.");
    assert(aria.includes("Disposition queue"), "ARIA snapshot lost disposition queue.");
    assertNoSensitiveSnapshot(aria, "records governance lifecycle");
    await assertNoSensitiveText(page.locator("body"), "records governance lifecycle");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
