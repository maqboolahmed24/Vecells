import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  expectAttribute,
  withOpsCompliancePage,
} from "./459_compliance_ledger.helpers";

export async function runGapQueueTriageSuite() {
  await withOpsCompliancePage(async (page) => {
    await page.goto(`${APP_URL}/ops/assurance?state=overdue-owner`, {
      waitUntil: "networkidle",
    });
    const ledger = page.locator("[data-testid='compliance-ledger-panel']");
    const queue = page.locator("[data-testid='control-evidence-gap-queue']");
    const drawer = page.locator("[data-testid='evidence-gap-resolution-drawer']");
    const burden = page.locator("[data-testid='gap-owner-burden-rail']");
    await ledger.waitFor();
    await queue.waitFor();
    await expectAttribute(ledger, "data-scenario-state", "overdue_owner");
    await expectAttribute(ledger, "data-action-control-state", "owner_review_only");
    assert(
      Number(await burden.getAttribute("data-overloaded-owner-count")) >= 1,
      "overdue-owner state should expose overloaded owner burden",
    );

    await page.locator("[data-testid='gap-filter-overdue']").click();
    await expectAttribute(queue, "data-queue-state", "diagnostic_only");
    assert(
      (await page.locator("[data-testid^='gap-queue-item-']").count()) >= 1,
      "overdue filter should retain queue items",
    );

    await page.locator("[data-testid='control-status-ledger-row-dtac_core']").focus();
    await page.keyboard.press("Enter");
    await expectAttribute(ledger, "data-selected-control", "dtac:core");

    await page.locator("[data-testid^='gap-queue-item-']").first().focus();
    await page.keyboard.press("Enter");
    await expectAttribute(drawer, "data-action-control-state", "owner_review_only");
    await expectAttribute(
      page.locator("[data-testid='gap-resolution-primary-action']"),
      "data-action-allowed",
      "true",
    );

    await page.locator("[data-testid='control-evidence-gap-queue'] select").selectOption("owner");
    const drawerText = await drawer.innerText();
    assert(drawerText.includes("/ops/"), "drawer should expose safe shell route handoff");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "compliance-ledger-overdue-owner-triage.png"),
      fullPage: true,
    });
  });
}

if (process.argv.includes("--run")) {
  await runGapQueueTriageSuite();
}
