import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubActingContextSwitcherCoverage = [
  "organisation switching preserves the current case anchor and route family",
  "site and purpose defaults follow the selected organisation without leaving the shell",
  "denied scope remains explicit instead of silently mutating the open case",
];

async function waitForRootAttributes(
  page: any,
  expected: Record<string, string>,
): Promise<void> {
  await page.waitForFunction((attrs) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) {
      return false;
    }
    return Object.entries(attrs).every(
      ([key, value]) => (root as HTMLElement).getAttribute(key) === value,
    );
  }, expected);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1520, height: 1120 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      routeFamily: "rf_hub_case_management",
      selectedCaseId: "hub-case-104",
    });
    await waitForRootAttributes(page, {
      "data-acting-organisation": "north_shore_hub",
      "data-acting-site": "north_shore_coordination_desk",
      "data-purpose-of-use": "direct_care_coordination",
      "data-access-posture": "writable",
      "data-break-glass-state": "inactive",
    });

    await page.getByTestId("HubActingContextChip").click();
    await waitForRootAttributes(page, { "data-scope-drawer-open": "true" });
    await page.getByTestId("OrganisationSwitchDrawer").waitFor();

    await page.locator("[data-organisation-option='riverside_medical']").click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-104",
      "data-selected-case-id": "hub-case-104",
      "data-acting-organisation": "riverside_medical",
      "data-acting-site": "riverside_callback_console",
      "data-purpose-of-use": "practice_follow_up",
      "data-audience-tier": "origin_practice_visibility",
      "data-access-posture": "read_only",
      "data-shell-status": "shell_read_only",
      "data-route-mutation": "disabled",
    });
    await page.getByTestId("AccessScopeTransitionReceipt").waitFor();
    assertCondition(
      (await page.getByTestId("AccessScopeTransitionReceipt").getAttribute(
        "data-scope-transition-outcome",
      )) === "preserve_read_only",
      "origin-practice switch lost the read-only transition receipt",
    );
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 3,
      "origin-practice switch should expose three governed placeholder blocks",
    );
    assertCondition(
      (await page.locator(
        "[data-testid='VisibilityEnvelopeLegend'] [data-audience-tier='origin_practice_visibility'][data-current='true']",
      ).count()) === 1,
      "origin-practice legend row should be current",
    );

    await page.locator("[data-organisation-option='elm_park_surgery']").click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-104",
      "data-selected-case-id": "hub-case-104",
      "data-acting-organisation": "elm_park_surgery",
      "data-acting-site": "elm_park_delivery_desk",
      "data-purpose-of-use": "site_delivery",
      "data-audience-tier": "servicing_site_visibility",
      "data-access-posture": "read_only",
      "data-shell-status": "shell_read_only",
    });
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 2,
      "servicing-site switch should expose two governed placeholder blocks",
    );
    assertCondition(
      (await page.locator(
        "[data-testid='VisibilityEnvelopeLegend'] [data-audience-tier='servicing_site_visibility'][data-current='true']",
      ).count()) === 1,
      "servicing-site legend row should be current",
    );

    await page.locator("[data-organisation-option='south_vale_network']").click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-104",
      "data-selected-case-id": "hub-case-104",
      "data-acting-organisation": "south_vale_network",
      "data-acting-site": "south_vale_intake_desk",
      "data-purpose-of-use": "direct_care_coordination",
      "data-audience-tier": "no_visibility",
      "data-access-posture": "denied",
      "data-shell-status": "shell_recovery_only",
      "data-route-mutation": "disabled",
    });
    await page.getByTestId("HubAccessDeniedState").waitFor();
    assertCondition(
      (await page.getByTestId("HubAccessDeniedState").getAttribute("data-access-posture")) ===
        "denied",
      "denied scope lost the explicit denied state marker",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({ path: outputPath("332-acting-context-switcher.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("332-acting-context-switcher-trace.zip") });
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
