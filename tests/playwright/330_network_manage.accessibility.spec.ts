import {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  networkManageUrl,
  openNetworkManageRoute,
  outputPath,
  waitForNetworkManageState,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
  writeJsonArtifact,
} from "./330_network_manage.helpers.ts";

export const networkManageAccessibilityCoverage = [
  "mobile network manage reflows without clipping",
  "timeline row disclosure exposes expanded state",
  "repair actions and folded rail detail remain keyboard-safe",
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
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });

    await openNetworkManageRoute(
      page,
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_live" }),
    );
    await assertNoHorizontalOverflow(page, "330 mobile live route");

    await page.getByTestId("timeline-row-reminder_delivered_live").click();
    const selectedRowButton = page
      .getByTestId("timeline-row-reminder_delivered_live")
      .locator("button");
    assertCondition(
      (await selectedRowButton.getAttribute("aria-expanded")) === "true",
      "selected timeline row should expose aria-expanded",
    );

    const liveRegion = page.getByTestId("patient-network-manage-live-region");
    assertCondition(
      (await liveRegion.getAttribute("role")) === "status",
      "route live region should expose status role",
    );

    await page.getByTestId("booking-mission-stack-rail-toggle").click();
    const drawer = page.getByTestId("booking-mission-stack-rail-drawer");
    await drawer.waitFor();
    assertCondition(
      (await drawer.getAttribute("aria-modal")) === "true",
      "folded rail detail should use dialog semantics",
    );

    await page.goto(
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_contact_repair" }),
      { waitUntil: "networkidle" },
    );
    await waitForNetworkManageState(page, {
      scenarioId: "network_manage_330_contact_repair",
      repairState: "required",
    });
    const repairButton = page.getByRole("button", { name: "Repair contact route" }).first();
    await repairButton.scrollIntoViewIfNeeded();
    await repairButton.focus();
    const repairVisible = await repairButton.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assertCondition(repairVisible, "repair button should remain visible when focused");

    const root = page.getByTestId("Patient_Network_Manage_Route");
    const aria = await captureAria(root, page);
    writeJsonArtifact("330-network-manage.aria.json", aria);
    await writeAccessibilitySnapshot(page, "330-network-manage.a11y.snapshot.json");
    await page.screenshot({
      path: outputPath("330-network-manage-mobile-a11y.png"),
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
