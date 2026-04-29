import {
  BOOKING_ENTRY_FIXTURE_IDS,
  assertCondition,
  bookingEntryUrl,
  importPlaywright,
  openBookingEntryRoute,
  outputPath,
  readReturnBinder,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  waitForBookingEntryPath,
} from "./300_record_origin_booking_entry.helpers.ts";

export const recordOriginBookingEntryNavigationCoverage = [
  "home compact panel launches booking entry with the home return contract intact",
  "request detail booking placeholder launches booking entry with the request return bundle intact",
  "appointment-origin booking entry continues into slot selection with the same origin query",
  "record follow-up launch preserves result provenance and safe return",
  "blocked record follow-up survives refresh without reopening a generic booking shell",
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

    const routeRoot = page.getByTestId("Patient_Record_Origin_Booking_Entry_Route");

    await page.goto(`${baseUrl}/home`, { waitUntil: "load" });
    await page.getByTestId("patient-home-route").waitFor();
    await page.getByTestId("home-compact-panel-appointments").getByRole("button").click();
    await waitForBookingEntryPath(page, BOOKING_ENTRY_FIXTURE_IDS.homeReady);
    let binder = await readReturnBinder(page);
    assertCondition(binder.returnRouteRef === "/home", `home return contract drifted: ${binder.returnRouteRef}`);
    assertCondition(
      binder.navReturnContractRef !== "not_applicable",
      "home launch should keep the nav return contract visible",
    );
    await page.getByTestId("booking-entry-action-return_to_origin").click();
    await page.waitForURL(`${baseUrl}/home`);
    await page.getByTestId("patient-home-route").waitFor();

    await page.goto(`${baseUrl}/requests/request_211_a`, { waitUntil: "load" });
    await page.getByTestId("request-detail-hero").waitFor();
    await page.getByTestId("governed-placeholder-open-booking").click();
    await waitForBookingEntryPath(page, BOOKING_ENTRY_FIXTURE_IDS.requestsReady);
    binder = await readReturnBinder(page);
    assertCondition(
      binder.requestReturnBundleRef !== "not_applicable",
      "request launch should keep the request return bundle visible",
    );
    assertCondition(
      binder.selectedAnchorRef === "request-detail-booking-entry",
      `request anchor drifted: ${binder.selectedAnchorRef}`,
    );
    await page.getByTestId("booking-entry-action-return_to_origin").click();
    await page.waitForURL(`${baseUrl}/requests/request_211_a`);
    await page.getByTestId("request-detail-hero").waitFor();

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.appointmentsReady),
    );
    await page.getByTestId("booking-entry-primary-action").click();
    await page.waitForURL(
      new RegExp(
        "/bookings/booking_case_297_ready/select\\?origin=appointments&returnRoute=%2Fappointments",
      ),
    );
    const workspace = page.getByTestId("Patient_Booking_Workspace_Route");
    await workspace.waitFor();
    assertCondition(
      (await workspace.getAttribute("data-route-key")) === "select",
      "appointments launch should continue into slot selection",
    );

    await page.goto(`${baseUrl}/records/results/result_213_fbc`, { waitUntil: "load" });
    await page.getByTestId("record-context-rail").waitFor();
    await page.getByTestId("record-follow-up-booking-launch").click();
    await waitForBookingEntryPath(page, BOOKING_ENTRY_FIXTURE_IDS.recordOriginReady);
    assertCondition(
      (await routeRoot.getAttribute("data-origin-object")) === "record_213_result_a",
      "record-ready launch should preserve the governing record object",
    );
    binder = await readReturnBinder(page);
    assertCondition(
      binder.returnRouteRef === "/records/results/result_213_fbc",
      `record-ready return route drifted: ${binder.returnRouteRef}`,
    );
    await page.getByTestId("booking-entry-return-action").click();
    await page.waitForURL(`${baseUrl}/records/results/result_213_fbc`);
    await page.getByTestId("record-context-rail").waitFor();

    await page.goto(`${baseUrl}/records/results/result_213_step_up`, { waitUntil: "load" });
    await page.getByTestId("record-follow-up-booking-launch").click();
    await waitForBookingEntryPath(page, BOOKING_ENTRY_FIXTURE_IDS.recordOriginRecovery);
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "blocked",
      "blocked record entry must stay blocked before refresh",
    );
    await page.reload({ waitUntil: "load" });
    await routeRoot.waitFor();
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "blocked",
      "blocked record entry should restore as blocked after refresh",
    );
    binder = await readReturnBinder(page);
    assertCondition(
      binder.recoveryContinuationTokenRef !== "not_applicable",
      "blocked record entry should preserve its recovery token after refresh",
    );

    assertCondition(
      externalRequests.size === 0,
      `booking entry navigation should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("300-record-origin-booking-entry-navigation-trace.zip"),
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
