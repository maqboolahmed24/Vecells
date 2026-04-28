import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeAtlasServer,
  importPlaywright,
  openStaffBookingRoute,
  outputPath,
  startClinicalWorkspace,
  startStaticAtlasServer,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const staffBookingHandoffPanelVisualCoverage = [
  "compare-live desktop screenshot",
  "linkage blocker desktop screenshot",
  "stale-recovery tablet screenshot",
  "confirmed mobile reduced-motion screenshot",
  "atlas screenshot",
];

// Visual proof is captured with explicit file outputs in this harness rather than expect(...).toHaveScreenshot().

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const { server, atlasUrl } = await startStaticAtlasServer("/docs/frontend/299_staff_booking_handoff_panel_atlas.html");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings");
    await page.screenshot({
      path: outputPath("299-booking-handoff-compare-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_299_linkage_required");
    await page.screenshot({
      path: outputPath("299-booking-handoff-linkage-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await page.setViewportSize({ width: 1100, height: 960 });
    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_299_stale_recovery");
    await page.screenshot({
      path: outputPath("299-booking-handoff-stale-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const mobilePage = await browser.newPage({
      viewport: { width: 430, height: 980 },
      reducedMotion: "reduce",
    });
    await openStaffBookingRoute(mobilePage, baseUrl, "/workspace/bookings/booking_case_299_confirmed");
    await assertNoHorizontalOverflow(mobilePage, "299 confirmed mobile");
    await mobilePage.screenshot({
      path: outputPath("299-booking-handoff-confirmed-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='StaffBookingHandoffPanelAtlas']").waitFor();
    await atlasPage.screenshot({
      path: outputPath("299-booking-handoff-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `staff booking visuals should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await closeAtlasServer(server);
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
