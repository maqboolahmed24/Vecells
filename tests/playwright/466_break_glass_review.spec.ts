import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  load466Evidence,
  withAuditAssuranceBrowser,
  writeAccessibilitySnapshot,
} from "./466_audit_assurance.helpers";

export async function run(): Promise<void> {
  const evidence = load466Evidence();
  assert.equal(evidence.breakGlass.failClosedOnAbsent, true);
  assert.equal(evidence.breakGlass.failClosedOnExpired, true);

  await withAuditAssuranceBrowser("466-break-glass-review", async (page) => {
    const root = page.locator("[data-testid='ops-shell-root']");
    const breakGlass = page.locator("[data-surface='break-glass-review']");
    const supportReplay = page.locator("[data-surface='support-replay-boundary']");
    const bundleExport = page.locator("[data-surface='investigation-bundle-export']");

    await page.goto(`${OPS_APP_URL}/ops/audit?state=normal`, { waitUntil: "networkidle" });
    await root.waitFor();
    await breakGlass.waitFor();
    await expectAttribute(breakGlass, "data-review-state", "not_required");
    await expectAttribute(breakGlass, "data-authorized-visibility", "true");
    let copy = await breakGlass.innerText();
    assert(copy.includes("minimum-necessary"), "Normal break-glass panel lost masking summary.");
    assert(copy.includes("2026-04-28T10:00:00Z"), "Normal break-glass panel lost expiry.");
    assert(copy.includes("No extra reviewer burden"), "Normal panel lost reviewer burden copy.");

    await page.goto(`${OPS_APP_URL}/ops/audit?state=blocked`, { waitUntil: "networkidle" });
    await root.waitFor();
    await breakGlass.waitFor();
    await expectAttribute(breakGlass, "data-review-state", "pending_review");
    await expectAttribute(breakGlass, "data-authorized-visibility", "true");
    copy = await breakGlass.innerText();
    assert(copy.includes("Contradicted"), "Blocked break-glass panel lost reason adequacy.");
    assert(copy.includes("Peer Review Required"), "Blocked panel lost follow-up burden.");
    assert(copy.includes("Reviewer must reconcile"), "Blocked panel lost review queue burden.");
    await expectAttribute(bundleExport, "data-export-state", "blocked");

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "466-break-glass-blocked-review.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/audit?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await root.waitFor();
    await breakGlass.waitFor();
    await expectAttribute(root, "data-overview-state", "permission_denied");
    await expectAttribute(breakGlass, "data-review-state", "expired");
    await expectAttribute(breakGlass, "data-authorized-visibility", "false");
    await expectAttribute(supportReplay, "data-restore-eligibility-state", "blocked");
    await expectAttribute(bundleExport, "data-export-state", "blocked");
    copy = await breakGlass.innerText();
    assert(copy.includes("Insufficient"), "Permission-denied panel lost reason adequacy.");
    assert(copy.includes("No widened visibility"), "Permission-denied panel widened visibility.");
    assert(copy.includes("expired"), "Permission-denied panel lost expiry state.");

    const aria = await writeAccessibilitySnapshot(page, "466-break-glass-permission.aria.yml");
    assert(aria.includes("Break-glass review"), "ARIA snapshot lost break-glass review.");
    assert(aria.includes("Support replay"), "ARIA snapshot lost support replay.");
    assertNoSensitiveSnapshot(aria, "break-glass review permission denied");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "466-break-glass-permission-denied.png"),
      fullPage: true,
    });
    await assertNoSensitiveText(page.locator("body"), "break-glass review states");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
