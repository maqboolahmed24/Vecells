import {
  assertCondition,
  importPlaywright,
  networkManageUrl,
  openNetworkManageRoute,
  outputPath,
  readNetworkManageMarkers,
  startPatientWeb,
  stopPatientWeb,
  waitForNetworkManageState,
  writeJsonArtifact,
} from "./330_network_manage.helpers.ts";

export const networkManageTimelineCoverage = [
  "reminder rows stay inside the unified message timeline",
  "callback fallback remains separate from reminder semantics while sharing the same cluster grammar",
  "contact-route repair preserves the selected message context across same-shell recovery",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });

    await openNetworkManageRoute(
      page,
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_live" }),
    );
    const timeline = page.getByTestId("MessageTimelineClusterView");
    await timeline.waitFor();
    assertCondition(
      (await timeline.locator("[data-reminder-row]").count()) === 2,
      "live route should render two reminder rows in the unified timeline",
    );
    assertCondition(
      (await timeline.locator("[data-callback-fallback='true']").count()) === 1,
      "callback fallback should render once inside the same timeline grammar",
    );

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_contact_repair" }),
      { waitUntil: "networkidle" },
    );
    await page
      .getByTestId("timeline-row-callback_fallback_notice")
      .locator("button")
      .click();
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_contact_repair",
      selectedTimelineRow: "callback_fallback_notice",
    });
    await page
      .getByTestId("ContactRouteRepairInlineJourney")
      .getByRole("button", { name: "Repair contact route" })
      .click();
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_live",
      selectedTimelineRow: "callback_fallback_notice",
    });
    let markers = await readNetworkManageMarkers(page);
    assertCondition(
      markers.messageContext === "Callback fallback",
      `repair recovery should preserve callback context, received ${String(markers.messageContext)}`,
    );

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_unsupported_reschedule" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_unsupported_reschedule",
      settlement: "unsupported_capability",
    });
    assertCondition(
      await timeline.locator("[data-callback-fallback='true']").isVisible(),
      "unsupported route should still keep callback fallback in the timeline",
    );

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_read_only" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_read_only",
      selectedTimelineRow: "reminder_suppressed_pending_confirmation",
    });
    markers = await readNetworkManageMarkers(page);
    assertCondition(
      markers.readOnlyMode === "read_only" && markers.settlement === "none",
      `read-only route should keep suppressed reminder context without settlement drift: ${JSON.stringify(markers)}`,
    );

    const timelineRows = await page
      .locator("[data-testid^='timeline-row-']")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          testId: node.getAttribute("data-testid"),
          reminderRow: node.getAttribute("data-reminder-row"),
          callbackFallback: node.getAttribute("data-callback-fallback"),
          rowKind: node.getAttribute("data-row-kind"),
        })),
      );
    writeJsonArtifact("330-network-manage-timeline-rows.json", timelineRows);

    await page.screenshot({
      path: outputPath("330-network-manage-timeline.png"),
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
