import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  assertRedactedComplianceExportPayload,
  expectAttribute,
  withSecurityComplianceExportBrowser,
} from "./463_security_compliance_exports.helpers";

export async function runComplianceExportDestinationsSuite() {
  await withSecurityComplianceExportBrowser(async (page) => {
    const compliancePayloads: Record<string, unknown>[] = [];
    await page.route("**/phase9/fake-compliance-export-receiver", async (route: any) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedComplianceExportPayload(payload);
      compliancePayloads.push(payload);
      await route.fulfill({
        status: compliancePayloads.length === 1 ? 202 : 200,
        contentType: "application/json",
        body: JSON.stringify({ accepted: compliancePayloads.length === 1 }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/security-compliance-exports?exportState=normal`, {
      waitUntil: "networkidle",
    });
    const surface = page.locator("[data-testid='security-compliance-export-config-surface']");
    await surface.waitFor();
    await page.locator("[data-testid='export-framework-select']").selectOption("DCB0129");
    await page
      .locator("[data-testid='export-destination-class-select']")
      .selectOption("dcb0129_manufacturer_safety_pack_delta_export");
    await page
      .locator("[data-testid='export-artifact-class-select']")
      .selectOption("dcb0129_manufacturer_safety_pack_delta");
    await page.locator("[data-testid='export-destination-secret-ref-input']").fill(
      "vault-ref/tenant-demo-gp/local/security-compliance-exports/dcb0129-manufacturer-safety-pack-delta-export/v1",
    );
    await page.locator("[data-testid='compliance-export-test-delivery-action']").click();
    await expectAttribute(surface, "data-selected-destination-class", "dcb0129_manufacturer_safety_pack_delta_export");
    await expectAttribute(surface, "data-delivery-result", "delivered");
    assert.equal(compliancePayloads.length, 1, "compliance receiver should receive one export call");
    assert.equal(
      compliancePayloads[0]?.artifactClass,
      "dcb0129_manufacturer_safety_pack_delta",
    );
    assert.equal(compliancePayloads[0]?.frameworkCode, "DCB0129");

    await page.locator("[data-testid='export-destination-fixture-state']").selectOption("stale_graph");
    await expectAttribute(surface, "data-scenario-state", "stale_graph");
    await page.locator("[data-testid='compliance-export-test-delivery-action']").click();
    await expectAttribute(surface, "data-verification-state", "stale_graph");
    await expectAttribute(surface, "data-source-readiness-state", "stale");
    const errorSummary = page.locator("[data-testid='security-compliance-export-error-summary']");
    await errorSummary.waitFor();
    assert(
      (await errorSummary.innerText()).includes("assurance graph hash"),
      "stale graph should require graph refresh",
    );

    await page
      .locator("[data-testid='export-destination-fixture-state']")
      .selectOption("blocked_redaction");
    await expectAttribute(surface, "data-scenario-state", "blocked_redaction");
    await page.locator("[data-testid='compliance-export-test-delivery-action']").click();
    await expectAttribute(surface, "data-delivery-result", "blocked_redaction");
    assert(
      (await errorSummary.innerText()).includes("Redaction parity"),
      "blocked redaction should be explicit",
    );

    await page
      .locator("[data-testid='export-destination-fixture-state']")
      .selectOption("delivery_failed");
    await expectAttribute(surface, "data-scenario-state", "delivery_failed");
    await page.locator("[data-testid='compliance-export-test-delivery-action']").click();
    await expectAttribute(surface, "data-delivery-result", "failed");
    assert.equal(compliancePayloads.length, 2, "delivery failure should call only the fake receiver");
    assert(
      (await errorSummary.innerText()).includes("Fake compliance export receiver rejected"),
      "delivery failure should keep fallback settlement visible",
    );

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "compliance-export-failure-states.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/conformance?exportState=stale_graph`, {
      waitUntil: "networkidle",
    });
    const readiness = page.locator("[data-testid='ops-security-compliance-export-readiness-strip']");
    await readiness.waitFor();
    await expectAttribute(readiness, "data-source-readiness-state", "stale");
    await expectAttribute(
      page.locator("[data-testid='ops-security-compliance-export-readiness-conformance']"),
      "data-readiness-state",
      "stale",
    );

    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?exportState=normal`, {
      waitUntil: "networkidle",
    });
    const recordsReadiness = page.locator(
      "[data-testid='records-security-compliance-export-readiness-strip']",
    );
    await recordsReadiness.waitFor();
    await expectAttribute(recordsReadiness, "data-records-export-readiness-state", "ready");
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("463_compliance_export_destinations.spec.ts")
) {
  await runComplianceExportDestinationsSuite();
}
