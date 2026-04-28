import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingSlotResultsVisualCoverage = [
  "renderable desktop screenshot",
  "partial tablet screenshot",
  "stale mobile reduced-motion screenshot",
  "no-supply desktop screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer("/docs/frontend/294_slot_results_and_freshness_atlas.html");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_renderable/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("294-slot-results-renderable-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_partial/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("294-slot-results-partial-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const reducedPage = await browser.newPage({
      viewport: { width: 430, height: 980 },
      reducedMotion: "reduce",
    });
    await openBookingRoute(
      reducedPage,
      `${baseUrl}/bookings/booking_case_294_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    await assertNoHorizontalOverflow(reducedPage, "294 stale mobile");
    await reducedPage.screenshot({
      path: outputPath("294-slot-results-stale-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1360, height: 980 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_no_supply/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("294-slot-results-no-supply-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='PatientBookingSlotResultsAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("294-slot-results-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `slot results should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
