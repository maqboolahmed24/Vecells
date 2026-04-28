import {
  assertCondition,
  importPlaywright,
  networkManageUrl,
  openNetworkManageRoute,
  outputPath,
  readNetworkManageMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  waitForNetworkManageState,
} from "./330_network_manage.helpers.ts";

export const networkManageViewCoverage = [
  "live manage posture loads from current capability and continuity truth",
  "same-shell actions move through provider-pending and applied settlement states",
  "blocked, stale, and read-only routes stay explicit instead of leaving stale CTAs alive",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    trackExternalRequests(page, baseUrl, externalRequests);

    await openNetworkManageRoute(
      page,
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_live" }),
    );
    let markers = await readNetworkManageMarkers(page);
    assertCondition(
      markers.capabilityState === "live" && markers.readOnlyMode === "interactive",
      `live route should start interactive, received ${JSON.stringify(markers)}`,
    );

    await page.getByRole("button", { name: "Request a different time" }).click();
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_provider_pending",
      readOnlyMode: "read_only",
      settlement: "provider_pending",
    });

    await page
      .getByTestId("HubManageSettlementPanel")
      .getByRole("button", { name: "Refresh manage status" })
      .click();
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_live",
      capabilityState: "live",
      settlement: "none",
    });

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_contact_repair" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_contact_repair",
      capabilityState: "blocked",
      repairState: "required",
      settlement: "blocked_dependency",
    });
    assertCondition(
      await page.getByTestId("ContactRouteRepairInlineJourney").isVisible(),
      "contact repair route should show the inline repair journey",
    );

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_stale_recoverable" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_stale_recoverable",
      capabilityState: "stale",
      settlement: "stale_recoverable",
    });

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_read_only" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_read_only",
      readOnlyMode: "read_only",
      settlement: "none",
    });
    markers = await readNetworkManageMarkers(page);
    assertCondition(
      markers.selectedTimelineRow === "reminder_suppressed_pending_confirmation",
      `read-only route should select the suppressed reminder row, received ${String(markers.selectedTimelineRow)}`,
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("330-network-manage-view.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
