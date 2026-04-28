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

export const patientBookingWorkspaceVisualCoverage = [
  "entry desktop screenshot",
  "selection tablet screenshot",
  "assisted desktop screenshot",
  "recovery mobile reduced-motion screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("293-booking-workspace-entry-desktop.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.screenshot({
      path: outputPath("293-booking-workspace-select-tablet.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1440, height: 1080 });
    await openBookingRoute(page, `${baseUrl}/bookings/booking_case_293_assisted?origin=home&returnRoute=/home`);
    await page.screenshot({
      path: outputPath("293-booking-workspace-assisted-desktop.png"),
      fullPage: true,
    });

    const reducedPage = await browser.newPage({
      viewport: { width: 430, height: 980 },
      reducedMotion: "reduce",
    });
    await openBookingRoute(
      reducedPage,
      `${baseUrl}/bookings/booking_case_293_recovery?origin=recovery&returnRoute=/home`,
    );
    await assertNoHorizontalOverflow(reducedPage, "293 recovery mobile");
    await reducedPage.screenshot({
      path: outputPath("293-booking-workspace-recovery-mobile.png"),
      fullPage: true,
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='PatientBookingWorkspaceAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("293-booking-workspace-atlas.png"),
      fullPage: true,
    });

    assertCondition(
      externalRequests.size === 0,
      `workspace should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
