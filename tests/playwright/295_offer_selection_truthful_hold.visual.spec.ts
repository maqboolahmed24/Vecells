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

export const patientBookingOfferSelectionVisualCoverage = [
  "nonexclusive desktop screenshot",
  "compare drawer desktop screenshot",
  "exclusive hold tablet screenshot",
  "stale mobile reduced-motion screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer("/docs/frontend/295_offer_selection_truthful_hold_atlas.html");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("295-offer-selection-nonexclusive-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.locator("[data-compare-trigger='open-compare']").click();
    await page.getByTestId("slot-compare-drawer").waitFor();
    await page.screenshot({
      path: outputPath("295-offer-selection-compare-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("295-offer-selection-exclusive-tablet.png"),
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
      `${baseUrl}/bookings/booking_case_295_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    await assertNoHorizontalOverflow(reducedPage, "295 stale mobile");
    await reducedPage.screenshot({
      path: outputPath("295-offer-selection-stale-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='PatientBookingOfferSelectionAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("295-offer-selection-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `offer selection should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
