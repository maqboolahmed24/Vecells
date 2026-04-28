import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

const ROOT_SELECTOR = "[data-testid='Patient_Booking_Workspace_Route']";

function secureLinkUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl}${pathname}?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link`;
}

export const bookingStatusProjectionCoverage = [
  "confirmed secure-link manage entry exposes settled patient and staff truth markers",
  "confirmed notification reassurance stays single-instance across repeated route loads",
  "confirmed manage view remains same-shell and continuity-safe",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    const root = page.locator(ROOT_SELECTOR);
    const confirmedUrl = secureLinkUrl(baseUrl, "/bookings/booking_case_306_confirmed/manage");

    await openBookingRoute(page, confirmedUrl);
    assertCondition(
      (await root.getAttribute("data-route-key")) === "manage",
      "confirmed entry should open the manage route",
    );
    assertCondition(
      (await root.getAttribute("data-origin-key")) === "secure_link",
      "confirmed entry should keep the secure_link origin",
    );
    assertCondition(
      (await root.getAttribute("data-notification-state")) === "confirmed",
      "confirmed entry should expose confirmed notification state",
    );
    const banner = page.getByTestId("booking-notification-entry-banner");
    await banner.waitFor();
    assertCondition(
      (await banner.getAttribute("data-notification-state")) === "confirmed",
      "confirmed banner should stay aligned with the route notification state",
    );
    await page.getByTestId("patient-appointment-manage-view").waitFor();
    assertCondition(
      (await page.getByTestId("patient-appointment-manage-view").getAttribute("data-confirmation-truth")) ===
        "confirmed",
      "manage view should expose confirmed confirmation truth",
    );

    const bannerCountBeforeReload = await page.locator("[data-testid='booking-notification-entry-banner']").count();
    assertCondition(
      bannerCountBeforeReload === 1,
      `confirmed route should render one notification banner, saw ${bannerCountBeforeReload}`,
    );

    await openBookingRoute(page, confirmedUrl);
    const bannerCountAfterReload = await page.locator("[data-testid='booking-notification-entry-banner']").count();
    assertCondition(
      bannerCountAfterReload === 1,
      `confirmed route should still render one notification banner after replay, saw ${bannerCountAfterReload}`,
    );
    assertCondition(
      (await page.getByText("Confirmed booking resumed from the secure-link entry").count()) === 1,
      "confirmed reassurance should remain single-instance after route replay",
    );

    await assertNoHorizontalOverflow(page, "306 booking status projection desktop");
    assertCondition(
      externalRequests.size === 0,
      `306 booking status projection should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("306-booking-status-projection-trace.zip"),
    });
    await context.close();
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
