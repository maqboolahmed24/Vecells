import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OUTPUT_DIR,
  assertRedactedReceiverPayload,
  expectAttribute,
  withDestinationBrowser,
  writeAccessibilitySnapshot,
} from "./461_destination_config.helpers";

export async function runDestinationRedactionAndSecretRefSuite() {
  await withDestinationBrowser(async (page) => {
    let fakeReceiverCalls = 0;
    await page.route("**/phase9/fake-alert-receiver", async (route: any) => {
      fakeReceiverCalls += 1;
      const payload = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      assertRedactedReceiverPayload(payload);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accepted: false, fixtureState: "delivery_failed" }),
      });
    });

    await page.goto(`${GOVERNANCE_APP_URL}/ops/config/destinations?state=missing-secret`, {
      waitUntil: "networkidle",
    });
    const surface = page.locator("[data-testid='operational-destination-config-surface']");
    await surface.waitFor();
    await expectAttribute(surface, "data-scenario-state", "missing_secret");
    await expectAttribute(surface, "data-verification-state", "missing_secret");
    await page.locator("[data-testid='destination-test-delivery-action']").click();
    const errorSummary = page.locator("[data-testid='destination-error-summary']");
    await errorSummary.waitFor();
    assert(
      (await errorSummary.innerText()).includes("Enter a vault reference"),
      "missing secret should focus the validation summary",
    );
    assert.equal(fakeReceiverCalls, 0, "missing secret must not call the receiver");

    await page.locator("[data-testid='destination-secret-ref-input']").fill(
      "vault-ref/tenant-demo-gp/local/alerting/service-level-breach-risk-alert/v1",
    );
    await page.locator("[data-testid='destination-fixture-state']").selectOption("denied_scope");
    await page.locator("[data-testid='destination-test-delivery-action']").click();
    await expectAttribute(surface, "data-scenario-state", "denied_scope");
    assert(
      (await errorSummary.innerText()).includes("operator scope"),
      "denied scope should preserve a visible error summary",
    );
    assert.equal(fakeReceiverCalls, 0, "denied scope must not call the receiver");

    await page.locator("[data-testid='destination-fixture-state']").selectOption("stale_destination");
    await page.locator("[data-testid='destination-test-delivery-action']").click();
    await expectAttribute(surface, "data-verification-state", "stale");
    assert(
      (await errorSummary.innerText()).includes("runtime publication"),
      "stale destination should require runtime publication refresh",
    );

    await page.locator("[data-testid='destination-fixture-state']").selectOption("permission_denied");
    await page.locator("[data-testid='destination-test-delivery-action']").click();
    await expectAttribute(surface, "data-verification-state", "permission_denied");
    assert(
      (await errorSummary.innerText()).includes("cannot configure"),
      "permission denial should be visible and bounded",
    );

    await page.locator("[data-testid='destination-fixture-state']").selectOption("delivery_failed");
    await page.locator("[data-testid='destination-test-delivery-action']").click();
    await expectAttribute(surface, "data-verification-state", "failed");
    assert.equal(fakeReceiverCalls, 1, "delivery failure should call only the fake receiver");
    assert(
      (await errorSummary.innerText()).includes("Fake receiver rejected"),
      "delivery failure should keep fallback visible",
    );
    await expectAttribute(
      page.locator("[data-testid='destination-readiness-operations']"),
      "data-readiness-state",
      "blocked",
    );

    const serializedDom = await page
      .locator("[data-testid='operational-destination-config-surface']")
      .evaluate((surface: HTMLElement) => surface.textContent);
    assert(!String(serializedDom).match(/https?:\/\//), "surface must not expose raw endpoints");
    assert(!String(serializedDom).match(/sk_live|BEGIN PRIVATE|Bearer|access_token/));
    assert(
      String(serializedDom).includes("vault-ref/"),
      "DOM should expose vault refs rather than inline secret material",
    );
    await writeAccessibilitySnapshot(page, "destination-redaction-and-errors.json");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "destination-redaction-failure-states.png"),
      fullPage: true,
    });
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("461_destination_redaction_and_secret_refs.spec.ts")
) {
  await runDestinationRedactionAndSecretRefSuite();
}
