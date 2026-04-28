import {
  BOOKING_ENTRY_ATLAS_PATH,
  BOOKING_ENTRY_FIXTURE_IDS,
  assertCondition,
  assertNoHorizontalOverflow,
  bookingEntryUrl,
  closeServer,
  importPlaywright,
  openBookingEntryRoute,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
} from "./300_record_origin_booking_entry.helpers.ts";

export const recordOriginBookingEntryVisualCoverage = [
  "home-origin entry desktop screenshot",
  "request-origin entry desktop screenshot",
  "appointments read-only tablet screenshot",
  "record-origin ready desktop screenshot",
  "record-origin recovery mobile screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer(BOOKING_ENTRY_ATLAS_PATH);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.homeReady),
    );
    await page.screenshot({
      path: outputPath("300-booking-entry-home-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.requestsReady),
    );
    await page.screenshot({
      path: outputPath("300-booking-entry-request-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.appointmentsReadOnly),
    );
    await page.screenshot({
      path: outputPath("300-booking-entry-appointments-read-only-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1440, height: 1080 });
    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginReady),
    );
    await page.screenshot({
      path: outputPath("300-booking-entry-record-ready-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const reducedPage = await browser.newPage({
      viewport: { width: 430, height: 980 },
      reducedMotion: "reduce",
    });
    await openBookingEntryRoute(
      reducedPage,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginRecovery),
    );
    await assertNoHorizontalOverflow(reducedPage, "300 booking entry recovery mobile");
    await reducedPage.screenshot({
      path: outputPath("300-booking-entry-record-recovery-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='RecordOriginBookingEntryAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("300-record-origin-booking-entry-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `booking entry visuals should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await closeServer(server);
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
