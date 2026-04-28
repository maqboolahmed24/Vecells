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

export const patientWaitlistViewsVisualCoverage = [
  "join waitlist desktop screenshot",
  "actionable offer desktop screenshot",
  "fallback due tablet screenshot",
  "expired mobile reduced-motion screenshot",
  "atlas screenshot",
];

// Visual proof is captured with explicit file outputs in this harness rather than expect(...).toHaveScreenshot().

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer("/docs/frontend/298_waitlist_views_atlas.html");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_join_sheet/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("298-waitlist-join-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("298-waitlist-offer-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("298-waitlist-fallback-tablet.png"),
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
      `${baseUrl}/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await assertNoHorizontalOverflow(reducedPage, "298 waitlist expired mobile");
    await reducedPage.screenshot({
      path: outputPath("298-waitlist-expired-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='PatientWaitlistViewsAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("298-waitlist-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `waitlist visuals should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
