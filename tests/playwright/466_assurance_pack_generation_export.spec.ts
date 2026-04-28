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
  assert.equal(evidence.assurancePack.requiredFrameworksCovered, true);
  assert.equal(evidence.assurancePack.exportReadySettlement, "export_ready");

  await withAuditAssuranceBrowser("466-assurance-pack-generation-export", async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/assurance?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const center = page.locator("[data-surface='assurance-center']");
    const packPreview = page.locator("[data-surface='pack-preview']");
    const packSettlement = page.locator("[data-surface='pack-settlement']");
    const packExportState = page.locator("[data-surface='pack-export-state']");
    await root.waitFor();
    await center.waitFor();

    await expectAttribute(root, "data-current-path", "/ops/assurance");
    await expectAttribute(root, "data-assurance-binding-state", "live");
    await expectAttribute(root, "data-assurance-pack-state", "export_ready");
    await expectAttribute(root, "data-assurance-settlement-result", "export_ready");
    await expectAttribute(center, "data-framework", "DTAC");
    await expectAttribute(center, "data-binding-state", "live");
    await expectAttribute(center, "data-pack-state", "export_ready");
    await expectAttribute(center, "data-export-control-state", "live_export");
    await expectAttribute(center, "data-settlement-result", "export_ready");
    await expectAttribute(packPreview, "data-reproduction-state", "exact");
    await expectAttribute(packSettlement, "data-settlement-result", "export_ready");
    await expectAttribute(packExportState, "data-artifact-state", "external_handoff_ready");

    const exportAction = page.locator("[data-testid='assurance-action-export_external']");
    await expectAttribute(exportAction, "data-action-allowed", "true");
    await expectAttribute(exportAction, "data-settlement-result", "export_ready");
    const previewCopy = await packPreview.innerText();
    for (const requiredLabel of [
      "Evidence set",
      "Continuity set",
      "Graph decision",
      "Query plan",
      "Render template",
      "Redaction policy",
      "Reproduction",
    ]) {
      assert(previewCopy.includes(requiredLabel), `Pack preview lost ${requiredLabel}.`);
    }

    for (const [buttonId, expectedFramework] of [
      ["assurance-framework-dspt", "DSPT"],
      ["assurance-framework-dcb0129", "DCB0129"],
      ["assurance-framework-dcb0160", "DCB0160"],
      ["assurance-framework-dtac", "DTAC"],
    ] as const) {
      await page.locator(`[data-testid='${buttonId}']`).click();
      await expectAttribute(center, "data-framework", expectedFramework);
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "466-assurance-pack-export-ready.png"),
      fullPage: true,
    });
    const aria = await writeAccessibilitySnapshot(page, "466-assurance-pack-normal.aria.yml");
    assert(aria.includes("Assurance Center"), "ARIA snapshot lost assurance center.");
    assert(aria.includes("Pack preview"), "ARIA snapshot lost pack preview.");
    assert(aria.includes("Pack export state"), "ARIA snapshot lost export state.");
    assertNoSensitiveSnapshot(aria, "assurance pack normal");
    await assertNoSensitiveText(page.locator("body"), "assurance pack normal");

    for (const [
      queryState,
      expectedBinding,
      expectedPack,
      expectedControl,
      expectedSettlement,
      expectedArtifact,
    ] of [
      [
        "stale",
        "diagnostic_only",
        "stale_pack",
        "diagnostic_only",
        "stale_pack",
        "governed_preview",
      ],
      [
        "degraded",
        "diagnostic_only",
        "awaiting_attestation",
        "attestation_required",
        "pending_attestation",
        "governed_preview",
      ],
      ["blocked", "blocked", "blocked_trust", "blocked", "blocked_trust", "summary_only"],
      ["permission-denied", "blocked", "denied_scope", "blocked", "denied_scope", "summary_only"],
    ] as const) {
      await page.goto(`${OPS_APP_URL}/ops/assurance?state=${queryState}`, {
        waitUntil: "networkidle",
      });
      await root.waitFor();
      await center.waitFor();
      await expectAttribute(center, "data-binding-state", expectedBinding);
      await expectAttribute(center, "data-pack-state", expectedPack);
      await expectAttribute(center, "data-export-control-state", expectedControl);
      await expectAttribute(center, "data-settlement-result", expectedSettlement);
      await expectAttribute(packExportState, "data-artifact-state", expectedArtifact);
      assert.notEqual(
        await center.getAttribute("data-export-control-state"),
        "live_export",
        `${queryState} incorrectly allowed live pack export.`,
      );
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `466-assurance-pack-${queryState}.png`),
        fullPage: true,
      });
      await assertNoSensitiveText(page.locator("body"), `assurance pack ${queryState}`);
    }
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
