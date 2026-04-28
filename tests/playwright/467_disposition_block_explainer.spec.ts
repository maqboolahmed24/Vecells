import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  load467Evidence,
  withRecordsGovernanceBrowser,
  writeAccessibilitySnapshot,
} from "./467_records_governance.helpers";

async function waitForRecords(page: any) {
  await page.locator("[data-surface='records-governance']").waitFor();
  await page.locator("[data-surface='block-explainer']").waitFor();
  await page.locator("[data-surface='lifecycle-ledger']").waitFor();
  await page.locator("[data-surface='disposition-queue']").waitFor();
}

export async function run(): Promise<void> {
  const evidence = load467Evidence();
  assert.equal(evidence.gapClosures.dependencyLightGap, true);
  assert.equal(evidence.gapClosures.uiMismatchGap, true);
  assert.equal(evidence.noPhi, true);
  assert.equal(evidence.noSecrets, true);

  await withRecordsGovernanceBrowser("467-disposition-block-explainer", async (page) => {
    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=normal`, {
      waitUntil: "networkidle",
    });
    await waitForRecords(page);
    const records = page.locator("[data-surface='records-governance']");
    await expectAttribute(records, "data-scenario-state", "normal");

    const blockExplainer = page.locator("[data-surface='block-explainer']");
    const blockText = await blockExplainer.innerText();
    assert(blockText.includes("legal-hold"), "Default block explainer should show active hold.");
    assert(blockText.includes("freeze"), "Default block explainer should show active freeze.");
    assert(
      blockText.includes("dep_442"),
      "Default block explainer should show graph dependency refs.",
    );
    assert(blockText.includes("artifact:transcript-442-held-009"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "467-dependency-blocked.png"),
      fullPage: true,
    });

    const wormRow = page.locator("[data-graph-criticality='worm']");
    const replayRow = page.locator("[data-graph-criticality='replay_critical']");
    await expectAttribute(wormRow, "data-delete-control-state", "suppressed");
    await expectAttribute(wormRow, "data-eligibility-state", "archive_only");
    await expectAttribute(replayRow, "data-delete-control-state", "suppressed");
    await expectAttribute(replayRow, "data-eligibility-state", "archive_only");
    const replayText = await replayRow.innerText();
    assert(replayText.includes("Replay-critical"), "Replay row should be visible.");
    assert(replayText.includes("archive_only"), "Replay row should stay archive-only.");

    const dispositionText = await page.locator("[data-surface='disposition-queue']").innerText();
    assert(dispositionText.includes("current_assessment"));
    for (const forbidden of ["raw_storage_scan", "bucket_prefix", "object_store_manifest"]) {
      assert(!dispositionText.includes(forbidden), `Disposition queue exposed ${forbidden}.`);
    }

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=stale`, {
      waitUntil: "networkidle",
    });
    await waitForRecords(page);
    await expectAttribute(records, "data-scenario-state", "stale");
    await expectAttribute(records, "data-binding-state", "revalidation_required");
    await expectAttribute(records, "data-graph-state", "stale");
    await expectAttribute(
      page.locator("[data-testid='records-action-approve_archive_job']"),
      "data-action-allowed",
      "false",
    );
    await expectAttribute(
      page.locator("[data-testid='records-action-approve_deletion_job']"),
      "data-action-allowed",
      "false",
    );
    const staleActionTitle = await page
      .locator("[data-testid='records-action-approve_deletion_job']")
      .getAttribute("title");
    assert(
      staleActionTitle?.includes("current assessment") && staleActionTitle.includes("graph proof"),
      "Stale graph disabled reason should explain policy basis and next review need.",
    );

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await waitForRecords(page);
    await expectAttribute(records, "data-scenario-state", "permission_denied");
    const deniedText = await records.innerText();
    assert(deniedText.includes("scope is denied"));
    assert(deniedText.includes("summary-only"));
    assert.equal(
      await page.locator("[data-testid^='records-action-'][data-action-allowed='true']").count(),
      0,
      "Denied scope should not expose allowed actions.",
    );

    const aria = await writeAccessibilitySnapshot(page, "467-disposition-block-explainer.aria.yml");
    assert(aria.includes("Dependency and immutability explainer"));
    assert(aria.includes("Records governance actions"));
    assertNoSensitiveSnapshot(aria, "disposition block explainer");
    await assertNoSensitiveText(page.locator("body"), "disposition block explainer");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
