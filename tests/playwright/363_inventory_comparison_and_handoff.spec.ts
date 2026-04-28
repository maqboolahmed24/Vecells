import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2124/inventory"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124/inventory",
      routeKey: "inventory",
      selectedCaseId: "PHC-2124",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    const supportHost = page.locator("[data-testid='PharmacySupportRegionHost']");

    assertCondition(
      await page.getByTestId("InventoryTruthPanel").isVisible(),
      "Inventory route must render the inventory truth panel.",
    );
    assertCondition(
      await page.getByTestId("InventoryComparisonWorkspace").isVisible(),
      "Inventory route must render the comparison workspace.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "inventory_comparison" &&
        (await supportHost.getAttribute("data-support-region")) === "inventory_comparison",
      "Inventory route must promote only the inventory comparison support region.",
    );
    assertCondition(
      (await page.getByTestId("HandoffReadinessBoard").count()) === 0,
      "Inventory route must not keep the handoff board active at the same time.",
    );

    await page.getByTestId("pharmacy-route-button-handoff").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2124",
    });

    assertCondition(
      await page.getByTestId("HandoffReadinessBoard").isVisible(),
      "Handoff route must render the handoff readiness board.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "handoff_readiness" &&
        (await supportHost.getAttribute("data-support-region")) === "handoff_readiness",
      "Handoff route must promote only the handoff readiness support region.",
    );
    assertCondition(
      (await page.getByTestId("InventoryComparisonWorkspace").count()) === 0,
      "Inventory comparison must not remain promoted after the handoff route opens.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
    });

    assertCondition(
      (await root.getAttribute("data-workbench-provider-health")) === "outage",
      "Provider outage case must expose the blocked provider-health state on the shell root.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-handoff-state")) === "Outage hold",
      "Provider outage case must keep the handoff state blocked.",
    );
    assertCondition(
      (await page.locator("[data-testid='HandoffReadinessBoard']").textContent())?.includes(
        "provider_connectivity_outage",
      ) ?? false,
      "Handoff readiness board must keep the provider outage blocker explicit.",
    );

    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
