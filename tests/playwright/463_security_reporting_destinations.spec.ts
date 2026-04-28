import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  assertRedactedSecurityReportingPayload,
  expectAttribute,
  withSecurityComplianceExportBrowser,
} from "./463_security_compliance_exports.helpers";

export async function runSecurityReportingDestinationsSuite() {
  await withSecurityComplianceExportBrowser(async (page) => {
    const securityPayloads: Record<string, unknown>[] = [];
    await page.route("**/phase9/fake-security-reporting-receiver", async (route: any) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedSecurityReportingPayload(payload);
      securityPayloads.push(payload);
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ accepted: true, receiverRecordId: `security-${securityPayloads.length}` }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/security-compliance-exports?exportState=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const surface = page.locator("[data-testid='security-compliance-export-config-surface']");
    await root.waitFor();
    await surface.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/config/security-compliance-exports");
    await expectAttribute(surface, "data-visual-mode", "Security_Compliance_Export_Control_Ledger");
    await expectAttribute(surface, "data-scenario-state", "normal");
    await expectAttribute(surface, "data-selected-destination-class", "reportable_data_security_incident_handoff");
    await expectAttribute(surface, "data-verification-state", "verified");
    await expectAttribute(surface, "data-delivery-result", "delivered");
    await expectAttribute(surface, "data-reportability-handoff-state", "verified");

    await page.locator("[data-testid='export-tenant-select']").selectOption("tenant-assurance-lab");
    await page.locator("[data-testid='export-environment-select']").selectOption("preview");
    await page.locator("[data-testid='export-framework-select']").selectOption("DSPT");
    await page
      .locator("[data-testid='export-destination-class-select']")
      .selectOption("reportable_data_security_incident_handoff");
    await page.locator("[data-testid='export-destination-secret-ref-input']").focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(
      "vault-ref/tenant-assurance-lab/preview/security-compliance-exports/reportable-data-security-incident-handoff/v1",
    );
    await page.locator("[data-testid='security-reporting-verify-action']").click();
    assert.equal(securityPayloads.length, 1, "security receiver should receive one handoff call");
    assert.equal(securityPayloads[0]?.tenantRef, "tenant-assurance-lab");
    assert.equal(securityPayloads[0]?.environmentRef, "preview");
    assert.equal(securityPayloads[0]?.frameworkCode, "DSPT");
    assert.equal(securityPayloads[0]?.handoffState, "verified");

    const liveRegion = page.locator("[data-testid='security-compliance-export-live']");
    const startedAt = Date.now();
    while (Date.now() - startedAt < 3_000) {
      if ((await liveRegion.innerText()).includes("Reportability handoff verified")) {
        break;
      }
      await page.waitForTimeout(50);
    }
    assert(
      (await liveRegion.innerText()).includes("Reportability handoff verified"),
      "aria-live message should settle after reportability handoff",
    );

    await expectAttribute(
      page.locator("[data-testid='export-artifact-policy-rail']"),
      "data-no-raw-export-urls",
      "true",
    );

    const bodyText = await page.locator("body").evaluate((body: HTMLElement) => body.textContent);
    assert(!String(bodyText).match(/https?:\/\//), "config UI must not expose raw endpoints");
    assert(!String(bodyText).match(/sk_live|Bearer|access_token|BEGIN PRIVATE|clinicalNarrative/));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "security-reporting-config-normal.png"),
      fullPage: true,
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "security-reporting-observed-payloads.json"),
      `${JSON.stringify({ securityPayloads }, null, 2)}\n`,
    );

    await page.goto(`${OPS_APP_URL}/ops/incidents?exportState=normal`, { waitUntil: "networkidle" });
    const opsRoot = page.locator("[data-testid='ops-shell-root']");
    const readiness = page.locator("[data-testid='ops-security-compliance-export-readiness-strip']");
    await opsRoot.waitFor();
    await readiness.waitFor();
    await expectAttribute(opsRoot, "data-security-compliance-export-state", "normal");
    await expectAttribute(readiness, "data-source-readiness-state", "ready");
    await expectAttribute(
      page.locator("[data-testid='ops-security-compliance-export-readiness-incident']"),
      "data-readiness-state",
      "ready",
    );
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("463_security_reporting_destinations.spec.ts")
) {
  await runSecurityReportingDestinationsSuite();
}
