import {
  BOOKING_ENTRY_FIXTURE_IDS,
  BOOKING_309_PATIENT_PATHS,
  assertCondition,
  assertNoExternalRequests,
  assertNoHorizontalOverflow,
  bookingEntryUrl,
  openBookingEntryRoute,
  openBookingRoute,
  outputPath,
  patientPathUrl,
  readEntryReturnBinder,
  readManageMarkers,
  readPatientWorkspaceMarkers,
  readWorkspaceReturnBinder,
  secureLinkUrl,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  importPlaywright,
} from "./309_phase4_local_booking.helpers.ts";

export const notificationAndRecordOriginReentryCoverage = [
  "home, requests, and appointments launches preserve distinct quiet-return binders without mutating booking truth",
  "record-origin booking entry continues into the same booking shell with preserved continuation and recovery tokens",
  "secure-link handoff, confirmed manage re-entry, and reopened recovery re-entry stay same-shell and single-banner safe",
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

    await openBookingRoute(page, patientPathUrl(baseUrl, "homeWorkspace"));
    let rootMarkers = await readPatientWorkspaceMarkers(page);
    let binder = await readWorkspaceReturnBinder(page);
    assertCondition(rootMarkers.originKey === "home", "home launch origin drifted");
    assertCondition(binder.returnRouteRef === "/home", "home launch return route drifted");

    await openBookingRoute(page, patientPathUrl(baseUrl, "requestsWorkspace"));
    rootMarkers = await readPatientWorkspaceMarkers(page);
    binder = await readWorkspaceReturnBinder(page);
    assertCondition(rootMarkers.originKey === "requests", "requests launch origin drifted");
    assertCondition(binder.returnRouteRef === "/requests", "requests launch return route drifted");

    await openBookingRoute(page, patientPathUrl(baseUrl, "appointmentsWorkspace"));
    rootMarkers = await readPatientWorkspaceMarkers(page);
    binder = await readWorkspaceReturnBinder(page);
    assertCondition(rootMarkers.originKey === "appointments", "appointments launch origin drifted");
    assertCondition(
      binder.returnRouteRef === "/appointments",
      "appointments launch return route drifted",
    );
    assertCondition(
      rootMarkers.capabilityPosture === "self_service_live",
      "origin swaps must not mutate live capability posture",
    );

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginReady),
    );
    const entryRoot = page.getByTestId("Patient_Record_Origin_Booking_Entry_Route");
    await entryRoot.waitFor();
    assertCondition(
      (await entryRoot.getAttribute("data-origin-type")) === "record_origin",
      "record-origin entry origin drifted",
    );
    assertCondition(
      (await entryRoot.getAttribute("data-entry-writable")) === "writable",
      "record-origin entry must remain writable",
    );
    const entryBinder = await readEntryReturnBinder(page);
    assertCondition(
      entryBinder.returnRouteRef === "/records/results/result_213_fbc",
      "record-origin entry return route drifted",
    );
    assertCondition(
      entryBinder.recordOriginContinuationRef !== "not_applicable",
      "record-origin entry must expose its continuation envelope",
    );
    assertCondition(
      entryBinder.recoveryContinuationTokenRef !== "not_applicable",
      "record-origin entry must expose its recovery continuation token",
    );

    await page.getByTestId("booking-entry-primary-action").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      const binder = document.querySelector("[data-testid='booking-return-contract-binder']");
      return (
        root?.getAttribute("data-origin-key") === "record_origin" &&
        binder?.getAttribute("data-return-route-ref") === "/records/results/result_213_fbc"
      );
    });
    rootMarkers = await readPatientWorkspaceMarkers(page);
    binder = await readWorkspaceReturnBinder(page);
    assertCondition(
      rootMarkers.originKey === "record_origin",
      "record-origin handoff should preserve record_origin provenance",
    );
    assertCondition(
      binder.returnRouteRef === "/records/results/result_213_fbc",
      "record-origin workspace return route drifted",
    );

    await openBookingRoute(page, secureLinkUrl(baseUrl, BOOKING_309_PATIENT_PATHS.secureHandoff));
    rootMarkers = await readPatientWorkspaceMarkers(page);
    binder = await readWorkspaceReturnBinder(page);
    assertCondition(
      rootMarkers.notificationState === "handoff_active",
      "secure-link handoff notification state drifted",
    );
    assertCondition(rootMarkers.originKey === "secure_link", "secure-link handoff origin drifted");
    assertCondition(
      binder.returnRouteRef === "/recovery/secure-link",
      "secure-link handoff return route drifted",
    );
    assertCondition(
      await page.getByTestId("booking-notification-entry-banner").isVisible(),
      "secure-link handoff should render the notification entry banner",
    );

    const confirmedManageUrl = secureLinkUrl(
      baseUrl,
      BOOKING_309_PATIENT_PATHS.secureConfirmedManage,
    );
    await openBookingRoute(page, confirmedManageUrl);
    rootMarkers = await readPatientWorkspaceMarkers(page);
    const confirmedBinder = await readWorkspaceReturnBinder(page);
    const manageMarkers = await readManageMarkers(page);
    assertCondition(
      rootMarkers.routeKey === "manage",
      "secure-link confirmed route should open manage",
    );
    assertCondition(
      rootMarkers.notificationState === "confirmed",
      "secure-link confirmed notification state drifted",
    );
    assertCondition(
      manageMarkers.confirmationTruth === "confirmed",
      "secure-link confirmed manage truth drifted",
    );
    const bannerCountBeforeReload = await page
      .locator("[data-testid='booking-notification-entry-banner']")
      .count();
    assertCondition(
      bannerCountBeforeReload === 1,
      `secure-link confirmed route should render one banner, saw ${bannerCountBeforeReload}`,
    );

    await page.reload({ waitUntil: "load" });
    rootMarkers = await readPatientWorkspaceMarkers(page);
    const bannerCountAfterReload = await page
      .locator("[data-testid='booking-notification-entry-banner']")
      .count();
    const reloadedBinder = await readWorkspaceReturnBinder(page);
    assertCondition(rootMarkers.routeKey === "manage", "reload should keep the manage host");
    assertCondition(
      bannerCountAfterReload === 1,
      `secure-link confirmed route should remain single-banner after reload, saw ${bannerCountAfterReload}`,
    );
    assertCondition(
      confirmedBinder.shellContinuityKey === reloadedBinder.shellContinuityKey,
      "secure-link reload replaced the shell continuity key",
    );

    await openBookingRoute(page, secureLinkUrl(baseUrl, BOOKING_309_PATIENT_PATHS.secureReopened));
    rootMarkers = await readPatientWorkspaceMarkers(page);
    assertCondition(
      rootMarkers.notificationState === "reopened",
      "secure-link reopened notification state drifted",
    );
    assertCondition(
      await page.getByTestId("BookingRecoveryShell").isVisible(),
      "secure-link reopened route should keep the recovery shell visible",
    );

    await assertNoHorizontalOverflow(page, "309 notification and record-origin re-entry");
    assertNoExternalRequests("309 notification and record-origin re-entry", externalRequests);

    await page.screenshot({
      path: outputPath("309-notification-and-record-origin-reentry.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("309-notification-and-record-origin-reentry-trace.zip"),
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
