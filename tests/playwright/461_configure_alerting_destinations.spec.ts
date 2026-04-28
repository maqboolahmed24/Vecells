import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  assertRedactedReceiverPayload,
  expectAttribute,
  withDestinationBrowser,
} from "./461_destination_config.helpers";

export async function runConfigureAlertingDestinationsSuite() {
  await withDestinationBrowser(async (page) => {
    const observedPayloads: Record<string, unknown>[] = [];
    await page.route("**/phase9/fake-alert-receiver", async (route: any) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedReceiverPayload(payload);
      observedPayloads.push(payload);
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          accepted: true,
          receiverRecordId: `receiver-record-${observedPayloads.length}`,
        }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/destinations?state=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const surface = page.locator("[data-testid='operational-destination-config-surface']");
    await root.waitFor();
    await surface.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/config/destinations");
    await expectAttribute(surface, "data-visual-mode", "Operational_Destination_Control_Ledger");
    await expectAttribute(surface, "data-scenario-state", "normal");
    await expectAttribute(surface, "data-verification-state", "verified");

    await page.locator("[data-testid='destination-tenant-select']").selectOption("tenant-assurance-lab");
    await page.locator("[data-testid='destination-environment-select']").selectOption("preview");
    await page
      .locator("[data-testid='destination-class-select']")
      .selectOption("incident_creation_severity_escalation");
    await page.locator("[data-testid='destination-secret-ref-input']").focus();
    await page.keyboard.press("Meta+A");
    await page.keyboard.type("vault-ref/tenant-assurance-lab/preview/alerting/incident-command/v1");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expectAttribute(surface, "data-verification-state", "verified");
    assert.equal(observedPayloads.length, 1, "fake receiver should receive one verification call");
    assert.equal(observedPayloads[0]?.destinationClass, "incident_creation_severity_escalation");
    assert.equal(observedPayloads[0]?.tenantRef, "tenant-assurance-lab");
    assert.equal(observedPayloads[0]?.environmentRef, "preview");
    const liveRegion = page.locator("[data-testid='destination-verify-live']");
    const liveStartedAt = Date.now();
    while (Date.now() - liveStartedAt < 3_000) {
      if ((await liveRegion.innerText()).includes("Delivery verified")) {
        break;
      }
      await page.waitForTimeout(50);
    }
    assert(
      (await liveRegion.innerText()).includes("Delivery verified"),
      "aria-live verification message should settle after delivery",
    );

    await page.locator("[data-testid='destination-row-release_freeze_recovery_disposition']").click();
    await expectAttribute(
      surface,
      "data-selected-destination-class",
      "release_freeze_recovery_disposition",
    );
    await expectAttribute(
      page.locator("[data-testid='destination-redaction-secret-rail']"),
      "data-secret-inline",
      "false",
    );

    for (const target of ["operations", "incident", "assurance", "release", "resilience"]) {
      await page.locator(`[data-testid='destination-readiness-${target}']`).waitFor();
    }
    const bodyText = await page.locator("body").evaluate((body: HTMLElement) => body.textContent);
    assert(!String(bodyText).match(/https?:\/\//), "config UI must not expose raw endpoints");
    assert(!String(bodyText).match(/sk_live|Bearer|access_token/), "config UI must not expose raw secrets");

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "destination-config-normal.png"),
      fullPage: true,
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "destination-config-observed-payloads.json"),
      `${JSON.stringify(observedPayloads, null, 2)}\n`,
    );

    for (const route of ["/ops/overview", "/ops/incidents", "/ops/assurance", "/ops/resilience"]) {
      await page.goto(`${OPS_APP_URL}${route}?destinationState=normal`, { waitUntil: "networkidle" });
      const opsRoot = page.locator("[data-testid='ops-shell-root']");
      const readiness = page.locator("[data-testid='ops-destination-readiness-strip']");
      await opsRoot.waitFor();
      await readiness.waitFor();
      await expectAttribute(readiness, "data-destination-registry-state", "normal");
      assert.equal(
        await page.locator("[data-testid^='ops-destination-readiness-'][data-route]").count(),
        5,
        `${route} should expose all destination readiness consumers`,
      );
    }
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("461_configure_alerting_destinations.spec.ts")
) {
  await runConfigureAlertingDestinationsSuite();
}
