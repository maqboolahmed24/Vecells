import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  expectAttributePresent,
  load466Evidence,
  withAuditAssuranceBrowser,
  writeAccessibilitySnapshot,
} from "./466_audit_assurance.helpers";

export async function run(): Promise<void> {
  const evidence = load466Evidence();
  assert.equal(evidence.wormAudit.indexTruthGapClosed, true);
  assert.equal(evidence.supportReplay.replayExitGapClosed, true);

  await withAuditAssuranceBrowser("466-audit-explorer-and-replay", async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/audit?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const auditExplorer = page.locator("[data-surface='audit-explorer']");
    await root.waitFor();
    await auditExplorer.waitFor();

    await expectAttribute(root, "data-current-path", "/ops/audit");
    await expectAttribute(root, "data-investigation-graph-verdict", "complete");
    await expectAttribute(root, "data-investigation-export-state", "export_ready");
    await expectAttribute(auditExplorer, "data-graph-verdict", "complete");
    await expectAttribute(auditExplorer, "data-export-state", "export_ready");
    await expectAttributePresent(auditExplorer, "data-scope-hash");
    await expectAttributePresent(auditExplorer, "data-timeline-hash");
    await expectAttributePresent(auditExplorer, "data-investigation-question-hash");

    await page.locator("[data-surface='timeline-ladder']").waitFor();
    await page.locator("[data-surface='evidence-graph-mini-map']").waitFor();
    await page.locator("[data-surface='break-glass-review']").waitFor();
    await page.locator("[data-surface='support-replay-boundary']").waitFor();
    await page.locator("[data-surface='investigation-bundle-export']").waitFor();
    assert.equal(await page.locator("[data-surface='timeline-ladder'] tbody tr").count(), 4);
    assert.equal(await page.locator("[aria-label='Event evidence table'] tbody tr").count(), 4);
    assert(
      (await page.locator("[aria-label='Audit filters']").innerText()).includes("4 results"),
      "Audit filter rail lost deterministic result count.",
    );

    await expectAttribute(
      page.locator("[data-surface='support-replay-boundary']"),
      "data-restore-eligibility-state",
      "restore_live",
    );
    await expectAttribute(
      page.locator("[data-surface='investigation-bundle-export']"),
      "data-export-state",
      "export_ready",
    );

    await page.locator("[aria-label='Audit filters'] input").first().focus();
    await page.keyboard.press("Tab");
    assert(
      (await page.evaluate(() => document.activeElement?.tagName ?? "")).length > 0,
      "Keyboard focus disappeared in audit filters.",
    );

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "466-audit-explorer-normal.png"),
      fullPage: true,
    });
    const aria = await writeAccessibilitySnapshot(page, "466-audit-explorer-normal.aria.yml");
    assert(aria.includes("Audit Explorer"), "ARIA snapshot lost audit explorer.");
    assert(aria.includes("Timeline ladder"), "ARIA snapshot lost timeline ladder.");
    assert(aria.includes("Support replay"), "ARIA snapshot lost support replay.");
    assertNoSensitiveSnapshot(aria, "audit explorer normal");
    await assertNoSensitiveText(page.locator("body"), "audit explorer normal");

    for (const [queryState, expectedGraph, expectedExport, expectedReplay] of [
      ["stale", "stale", "summary_only", "stale_reacquire"],
      ["degraded", "stale", "redaction_review", "stale_reacquire"],
      ["blocked", "blocked", "blocked", "blocked"],
      ["permission-denied", "blocked", "blocked", "blocked"],
      ["settlement-pending", "stale", "redaction_review", "awaiting_external_hold"],
    ] as const) {
      await page.goto(`${OPS_APP_URL}/ops/audit?state=${queryState}`, {
        waitUntil: "networkidle",
      });
      await root.waitFor();
      await auditExplorer.waitFor();
      await expectAttribute(auditExplorer, "data-graph-verdict", expectedGraph);
      await expectAttribute(auditExplorer, "data-export-state", expectedExport);
      await expectAttribute(
        page.locator("[data-surface='support-replay-boundary']"),
        "data-restore-eligibility-state",
        expectedReplay,
      );
      if (expectedGraph !== "complete") {
        assert.notEqual(
          await page
            .locator("[data-surface='investigation-bundle-export']")
            .getAttribute("data-export-state"),
          "export_ready",
          `${queryState} incorrectly allowed export-ready bundle transfer.`,
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `466-audit-explorer-${queryState}.png`),
        fullPage: true,
      });
      await assertNoSensitiveText(page.locator("body"), `audit explorer ${queryState}`);
    }
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
