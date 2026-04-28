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

export const patientBookingConfirmationVisualCoverage = [
  "review confirmation desktop screenshot",
  "pending confirmation desktop screenshot",
  "recovery confirmation tablet screenshot",
  "confirmed summary desktop screenshot",
  "identity repair mobile screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer(
    "/docs/frontend/296_confirmation_pending_disputed_recovery_atlas.html",
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_review/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("296-confirmation-review-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("296-confirmation-pending-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("296-confirmation-recovery-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1440, height: 1080 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("296-confirmation-confirmed-desktop.png"),
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
      `${baseUrl}/bookings/booking_case_296_identity_repair/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await assertNoHorizontalOverflow(reducedPage, "296 identity repair mobile");
    await reducedPage.screenshot({
      path: outputPath("296-confirmation-identity-repair-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='PatientBookingConfirmationAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("296-confirmation-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `confirmation visuals should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
