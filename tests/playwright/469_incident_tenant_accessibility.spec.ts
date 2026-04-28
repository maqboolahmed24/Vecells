import assert from "node:assert/strict";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  load469Evidence,
  waitForIncidentSurfaces,
  waitForTenantSurfaces,
  withIncidentBrowser,
  withTenantGovernanceBrowser,
  writeAccessibilitySnapshot,
} from "./469_incident_tenant.helpers";

export async function run(): Promise<void> {
  const evidence = load469Evidence();
  assert.equal(evidence.noPhi, true);
  assert.equal(evidence.noIncidentDetails, true);
  assert.equal(evidence.noRouteParams, true);
  assert.equal(evidence.noArtifactFragments, true);
  assert.equal(evidence.noTracePersistence, true);

  await withIncidentBrowser(
    "469-incident-accessibility",
    async (page) => {
      await page.goto(`${OPS_APP_URL}/ops/incidents?state=normal`, { waitUntil: "networkidle" });
      await waitForIncidentSurfaces(page);
      await page.locator("[data-testid='near-miss-submit']").click();
      await page.locator("[data-testid='near-miss-error']").waitFor();
      const errorRole = await page.locator("[data-testid='near-miss-error']").getAttribute("role");
      assert.equal(errorRole, "alert", "Near-miss validation error should use alert semantics.");

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      const focusedLabel = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        return element?.innerText || element?.getAttribute("aria-label") || "";
      });
      assert(focusedLabel.length > 0, "Incident keyboard flow should preserve visible focus.");

      const aria = await writeAccessibilitySnapshot(page, "469-incident-aria.yml");
      assert(aria.includes("Incident Desk"), "Incident ARIA snapshot lost Incident Desk.");
      assert(aria.includes("Near-miss intake"), "Incident ARIA snapshot lost Near-miss intake.");
      assert(aria.includes("Reportability checklist"), "Incident ARIA snapshot lost reportability.");
      assert(aria.includes("Containment timeline"), "Incident ARIA snapshot lost containment.");
      assertNoSensitiveSnapshot(aria, "incident aria snapshot");
      await assertNoSensitiveText(page.locator("body"), "incident accessibility DOM");

      await page.goto(`${OPS_APP_URL}/ops/incidents?state=permission-denied`, {
        waitUntil: "networkidle",
      });
      await waitForIncidentSurfaces(page);
      await expectAttribute(
        page.locator("[data-testid='ops-shell-root']"),
        "data-overview-state",
        "permission_denied",
      );
      assert(
        (await page.locator("[data-surface='severity-board']").innerText()).includes(
          "metadata",
        ),
        "Incident permission denied copy should explain metadata-only scope.",
      );
      await assertNoSensitiveText(page.locator("body"), "incident permission denied DOM");
    },
    { viewport: { width: 390, height: 920 }, reducedMotion: true },
  );

  await withTenantGovernanceBrowser(
    "469-tenant-governance-accessibility",
    async (page) => {
      await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=normal`, {
        waitUntil: "networkidle",
      });
      await waitForTenantSurfaces(page);
      await page.locator("[data-testid='tenant-filter-blocked']").focus();
      await page.keyboard.press("Enter");
      await expectAttribute(
        page.locator("[data-testid='tenant-filter-blocked']"),
        "data-active",
        "true",
      );
      await page.locator("[data-testid='tenant-filter-all']").focus();
      await page.keyboard.press("Enter");
      await expectAttribute(page.locator("[data-testid='tenant-filter-all']"), "data-active", "true");

      const aria = await writeAccessibilitySnapshot(page, "469-tenant-governance-aria.yml");
      assert(aria.includes("Tenant governance"), "Tenant ARIA snapshot lost shell.");
      assert(aria.includes("Tenant baseline matrix"), "Tenant ARIA snapshot lost matrix.");
      assert(
        aria.includes("Standards dependency watchlist"),
        "Tenant ARIA snapshot lost standards watchlist.",
      );
      assert(aria.includes("Promotion approval status"), "Tenant ARIA snapshot lost promotion status.");
      assertNoSensitiveSnapshot(aria, "tenant governance aria snapshot");
      await assertNoSensitiveText(page.locator("body"), "tenant accessibility DOM");

      await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/tenants?state=permission-denied`, {
        waitUntil: "networkidle",
      });
      await waitForTenantSurfaces(page);
      await expectAttribute(
        page.locator("[data-surface='tenant-governance']"),
        "data-action-control-state",
        "metadata_only",
      );
      const deniedText = await page.locator("[data-surface='tenant-governance']").innerText();
      assert(deniedText.includes("metadata-only"), "Tenant permission denied copy should be explicit.");
      await assertNoSensitiveText(page.locator("body"), "tenant permission denied DOM");
    },
    { viewport: { width: 420, height: 940 }, reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
