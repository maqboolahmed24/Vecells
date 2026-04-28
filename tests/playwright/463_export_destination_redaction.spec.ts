import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  expectAttribute,
  withSecurityComplianceExportBrowser,
  writeAccessibilitySnapshot,
} from "./463_security_compliance_exports.helpers";

export async function runExportDestinationRedactionSuite() {
  await withSecurityComplianceExportBrowser(
    async (page) => {
      let securityReceiverCalls = 0;
      let complianceReceiverCalls = 0;
      await page.route("**/phase9/fake-security-reporting-receiver", async (route: any) => {
        securityReceiverCalls += 1;
        await route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify({ accepted: true }),
        });
      });
      await page.route("**/phase9/fake-compliance-export-receiver", async (route: any) => {
        complianceReceiverCalls += 1;
        await route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify({ accepted: true }),
        });
      });

      await page.goto(
        `${GOVERNANCE_APP_URL}/ops/config/security-compliance-exports?exportState=missing-secret`,
        { waitUntil: "networkidle" },
      );
      const root = page.locator("[data-testid='governance-shell-root']");
      const surface = page.locator("[data-testid='security-compliance-export-config-surface']");
      await root.waitFor();
      await surface.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(surface, "data-verification-state", "missing_secret");
      await expectAttribute(surface, "data-no-raw-export-urls", "true");

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const activeTestId = await page.evaluate(() =>
        document.activeElement?.getAttribute("data-testid"),
      );
      assert(activeTestId, "keyboard tab order should land on a testable export control");

      await page.locator("[data-testid='security-reporting-verify-action']").click();
      const errorSummary = page.locator("[data-testid='security-compliance-export-error-summary']");
      await errorSummary.waitFor();
      assert(
        (await errorSummary.innerText()).includes("vault reference"),
        "missing vault ref should be linked from the error summary",
      );
      assert.equal(securityReceiverCalls, 0, "missing secret must not call security receiver");
      assert.equal(complianceReceiverCalls, 0, "missing secret must not call compliance receiver");

      await page
        .locator("[data-testid='export-destination-row-archive_manifest_deletion_certificate_export']")
        .click();
      await expectAttribute(
        surface,
        "data-selected-destination-class",
        "archive_manifest_deletion_certificate_export",
      );
      await page.setViewportSize({ width: 760, height: 1040 });
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(
        surface,
        "data-selected-destination-class",
        "archive_manifest_deletion_certificate_export",
      );

      await page.locator("[data-testid='export-destination-fixture-state']").selectOption("permission_denied");
      await page.locator("[data-testid='compliance-export-test-delivery-action']").click();
      await expectAttribute(surface, "data-verification-state", "permission_denied");
      await expectAttribute(surface, "data-source-readiness-state", "permission_denied");
      assert(
        (await errorSummary.innerText()).includes("cannot configure"),
        "permission denial should be visible",
      );

      const snapshot = await writeAccessibilitySnapshot(page, "security-compliance-export-accessibility.json");
      assert(snapshot.includes("Security") || snapshot.includes("security"));
      assert(snapshot.includes("There is a problem"));

      const serializedDom = await page
        .locator("[data-testid='security-compliance-export-config-surface']")
        .evaluate((node: HTMLElement) => node.textContent);
      assert(!String(serializedDom).match(/https?:\/\//), "surface must not expose raw endpoints");
      assert(!String(serializedDom).match(/sk_live|Bearer|access_token|BEGIN PRIVATE|clinicalNarrative/));
      assert(String(serializedDom).includes("vault-ref/") || String(serializedDom).includes("Missing vault reference"));

      await page.screenshot({
        path: path.join(OUTPUT_DIR, "security-compliance-export-accessibility-mobile.png"),
        fullPage: true,
      });

      await page.goto(`${OPS_APP_URL}/ops/assurance?exportState=blocked_redaction`, {
        waitUntil: "networkidle",
      });
      const opsRoot = page.locator("[data-testid='ops-shell-root']");
      const readiness = page.locator("[data-testid='ops-security-compliance-export-readiness-strip']");
      await opsRoot.waitFor();
      await readiness.waitFor();
      await expectAttribute(opsRoot, "data-layout-mode", "mission_stack");
      await expectAttribute(readiness, "data-source-readiness-state", "blocked");
      await expectAttribute(readiness, "data-no-raw-export-urls", "true");
    },
    { viewport: { width: 820, height: 1120 }, reducedMotion: true },
  );
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("463_export_destination_redaction.spec.ts")
) {
  await runExportDestinationRedactionSuite();
}
