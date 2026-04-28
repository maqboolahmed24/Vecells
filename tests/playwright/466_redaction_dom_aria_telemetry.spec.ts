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
  assert.equal(evidence.redaction.redactionLeakageGapClosed, true);
  assert.equal(evidence.redaction.traceSafeSyntheticArtifactsOnly, true);

  await withAuditAssuranceBrowser(
    "466-redaction-dom-aria-telemetry",
    async (page) => {
      const auditStates = [
        ["normal", "complete", "export_ready"],
        ["permission-denied", "blocked", "blocked"],
        ["degraded", "stale", "redaction_review"],
      ] as const;

      for (const [queryState, expectedGraph, expectedExport] of auditStates) {
        await page.goto(`${OPS_APP_URL}/ops/audit?state=${queryState}`, {
          waitUntil: "networkidle",
        });
        const root = page.locator("[data-testid='ops-shell-root']");
        const auditExplorer = page.locator("[data-surface='audit-explorer']");
        await root.waitFor();
        await auditExplorer.waitFor();
        await expectAttribute(auditExplorer, "data-graph-verdict", expectedGraph);
        await expectAttribute(auditExplorer, "data-export-state", expectedExport);
        await assertNoSensitiveText(page.locator("body"), `audit redaction ${queryState}`);
        const aria = await writeAccessibilitySnapshot(
          page,
          `466-redaction-audit-${queryState}.aria.yml`,
        );
        assertNoSensitiveSnapshot(aria, `audit redaction ${queryState}`);
      }

      const assuranceStates = [
        ["normal", "export_ready", "export_ready"],
        ["degraded", "awaiting_attestation", "pending_attestation"],
        ["permission-denied", "denied_scope", "denied_scope"],
      ] as const;
      for (const [queryState, expectedPack, expectedSettlement] of assuranceStates) {
        await page.goto(`${OPS_APP_URL}/ops/assurance?state=${queryState}`, {
          waitUntil: "networkidle",
        });
        const root = page.locator("[data-testid='ops-shell-root']");
        const center = page.locator("[data-surface='assurance-center']");
        await root.waitFor();
        await center.waitFor();
        await expectAttribute(center, "data-pack-state", expectedPack);
        await expectAttribute(center, "data-settlement-result", expectedSettlement);
        await assertNoSensitiveText(page.locator("body"), `assurance redaction ${queryState}`);
        const aria = await writeAccessibilitySnapshot(
          page,
          `466-redaction-assurance-${queryState}.aria.yml`,
        );
        assertNoSensitiveSnapshot(aria, `assurance redaction ${queryState}`);
      }

      await page.goto(`${OPS_APP_URL}/ops/overview?state=normal`, { waitUntil: "networkidle" });
      const root = page.locator("[data-testid='ops-shell-root']");
      await root.waitFor();
      await page.locator("[data-testid='ops-telemetry-log']").waitFor();
      await assertNoSensitiveText(
        page.locator("[data-testid='ops-telemetry-log']"),
        "telemetry log",
      );
      await assertNoSensitiveText(page.locator("body"), "overview telemetry body");

      await page.setViewportSize({ width: 390, height: 920 });
      await page.goto(`${OPS_APP_URL}/ops/audit?state=degraded`, { waitUntil: "networkidle" });
      await root.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "466-redaction-degraded-reduced-motion-mobile.png"),
        fullPage: true,
      });
      await assertNoSensitiveText(page.locator("body"), "mobile reduced-motion redaction");
    },
    { viewport: { width: 1280, height: 960 }, reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
