import {
  BOOKING_ENTRY_FIXTURE_IDS,
  assertCondition,
  assertNoHorizontalOverflow,
  bookingEntryUrl,
  importPlaywright,
  openBookingEntryRoute,
  outputPath,
  readReturnBinder,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./300_record_origin_booking_entry.helpers.ts";

export const recordOriginBookingEntryCoverage = [
  "record-origin ready keeps provenance and continuation binder visible before continuing to booking",
  "appointment-origin read-only suppresses writable posture while preserving calm return",
  "record-origin recovery blocks stale booking and returns to the governing record shell",
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
    const surface = page.getByTestId("RecordOriginBookingEntrySurface");

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginReady),
    );
    await surface.waitFor();
    assertCondition(
      (await routeRoot.getAttribute("data-shell")) === "patient-booking-entry",
      "entry route shell marker drifted",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-origin-type")) === "record_origin",
      "record entry origin marker drifted",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "writable",
      "record entry should be writable when continuation is aligned",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-record-continuation-state")) === "aligned",
      "record entry continuation state drifted",
    );
    assertCondition(
      await page.getByTestId("RecordFollowUpBookingCard").isVisible(),
      "record-origin entry should keep the follow-up card visible",
    );
    const readyBinder = await readReturnBinder(page);
    assertCondition(
      readyBinder.returnRouteRef === "/records/results/result_213_fbc",
      `record-origin return route drifted: ${readyBinder.returnRouteRef}`,
    );
    assertCondition(
      readyBinder.recordOriginContinuationRef !== "not_applicable",
      "record-origin entry should expose its continuation envelope",
    );
    assertCondition(
      readyBinder.recoveryContinuationTokenRef !== "not_applicable",
      "record-origin entry should expose its recovery token",
    );
    await page.getByTestId("booking-entry-primary-action").click();
    await page.waitForURL(
      new RegExp(
        "/bookings/booking_case_293_live\\?origin=record_origin&returnRoute=%2Frecords%2Fresults%2Fresult_213_fbc",
      ),
    );
    await page.locator("[data-testid='Patient_Booking_Workspace_Route']").waitFor();

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.appointmentsReadOnly),
    );
    assertCondition(
      (await routeRoot.getAttribute("data-origin-type")) === "appointments",
      "appointment read-only route origin drifted",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-continuity-posture")) === "read_only",
      "appointment read-only posture drifted",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "read_only",
      "appointment read-only route must not become writable",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-return-posture")) === "read_only_return",
      "appointment read-only return posture drifted",
    );
    const readOnlyBinder = await readReturnBinder(page);
    assertCondition(
      readOnlyBinder.returnRouteRef === "/appointments",
      `appointment return route drifted: ${readOnlyBinder.returnRouteRef}`,
    );
    assertCondition(
      readOnlyBinder.recordOriginContinuationRef === "not_applicable",
      "appointment read-only route should not expose record-only continuation markers",
    );
    await page.getByTestId("booking-entry-primary-action").click();
    await page.waitForURL(`${baseUrl}/appointments`);
    await page.getByTestId("PatientAppointmentFamilyWorkspace").waitFor();

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginRecovery),
    );
    assertCondition(
      (await routeRoot.getAttribute("data-continuity-posture")) === "recovery_required",
      "recovery entry continuity posture drifted",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "blocked",
      "recovery entry must block booking controls",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-record-continuation-state")) === "awaiting_step_up",
      "record recovery continuation state drifted",
    );
    assertCondition(
      await page.getByTestId("BookingQuietReturnStub").isVisible(),
      "recovery entry should keep quiet return visible",
    );
    await assertNoHorizontalOverflow(page, "300 booking entry desktop");
    await page.getByTestId("booking-entry-return-action").click();
    await page.waitForURL(`${baseUrl}/records/results/result_213_step_up`);
    await page.getByTestId("record-visibility-placeholder").waitFor();

    assertCondition(
      externalRequests.size === 0,
      `booking entry route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("300-record-origin-booking-entry-trace.zip"),
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
