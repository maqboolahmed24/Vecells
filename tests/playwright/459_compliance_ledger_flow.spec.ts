import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsCompliancePage,
} from "./459_compliance_ledger.helpers";

export async function runComplianceLedgerFlowSuite() {
  await withOpsCompliancePage(async (page) => {
    await page.goto(`${APP_URL}/ops/assurance?state=exact`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const assurance = page.locator("[data-testid='ops-assurance-center']");
    const ledger = page.locator("[data-testid='compliance-ledger-panel']");
    await root.waitFor();
    await assurance.waitFor();
    await ledger.waitFor();

    await expectAttribute(root, "data-current-path", "/ops/assurance");
    await expectAttribute(ledger, "data-visual-mode", "Compliance_Ledger_Calm_Accountability");
    await expectAttribute(ledger, "data-scenario-state", "exact");
    await expectAttribute(ledger, "data-graph-verdict", "complete");
    await expectAttribute(ledger, "data-action-control-state", "review_ready");
    await expectAttribute(ledger, "data-projection-update-state", "settled");
    assert.equal(
      await page.locator("[data-surface='control-status-ledger-row']").count(),
      6,
      "ledger should expose six control rows",
    );

    await page.locator("[data-testid='standards-version-context-chip-dspt']").click();
    await expectAttribute(ledger, "data-framework", "DSPT");
    await expectAttribute(ledger, "data-projection-update-state", "settled");
    await expectAttribute(ledger, "data-selected-control", "dspt:core");

    await page.locator("[data-testid='control-status-ledger-row-dspt_technical_security']").click();
    await expectAttribute(ledger, "data-selected-control", "dspt:technical-security");
    await expectAttribute(
      page.locator("[data-testid='evidence-graph-mini-map']"),
      "data-graph-verdict",
      "complete",
    );
    await page.locator("[data-testid='gap-queue-item-gap_459_dspt_technical_security_1']").click();
    await expectAttribute(
      page.locator("[data-testid='evidence-gap-resolution-drawer']"),
      "data-action-control-state",
      "review_ready",
    );
    await assertNoRawArtifactUrls(page);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "compliance-ledger-exact-desktop.png"),
      fullPage: true,
    });

    for (const [state, verdict, action] of [
      ["stale", "stale", "diagnostic_only"],
      ["blocked", "blocked", "blocked"],
      ["graph-drift", "blocked", "blocked"],
      ["permission-denied", "blocked", "metadata_only"],
    ] as const) {
      await page.goto(`${APP_URL}/ops/assurance?state=${state}`, { waitUntil: "networkidle" });
      await ledger.waitFor();
      await expectAttribute(ledger, "data-graph-verdict", verdict);
      await expectAttribute(ledger, "data-action-control-state", action);
      await expectAttribute(
        page.locator("[data-testid='gap-resolution-primary-action']"),
        "data-raw-artifact-url-suppressed",
        "true",
      );
      await assertNoRawArtifactUrls(page);
    }
  });
}

if (process.argv.includes("--run")) {
  await runComplianceLedgerFlowSuite();
}
