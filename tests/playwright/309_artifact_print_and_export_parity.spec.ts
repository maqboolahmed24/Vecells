import {
  assertCondition,
  assertNoExternalRequests,
  assertNoHorizontalOverflow,
  bookingArtifactUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  patientPathUrl,
  readArtifactMarkers,
  readConfirmationMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./309_phase4_local_booking.helpers.ts";

export const artifactPrintAndExportParityCoverage = [
  "confirmed confirmation surfaces and artifact routes stay aligned on receipt, calendar, print, and browser-handoff readiness",
  "reconciliation-required artifact routes degrade to recovery-only posture and never mint detached export calmness",
  "embedded artifact delivery narrows print and handoff to summary-only posture without changing source provenance",
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

    await openBookingRoute(page, patientPathUrl(baseUrl, "confirmationConfirmed"));
    let confirmationMarkers = await readConfirmationMarkers(page);
    assertCondition(
      confirmationMarkers.confirmationTruth === "confirmed",
      "confirmed confirmation truth drifted",
    );
    assertCondition(
      confirmationMarkers.artifactExposure === "handoff_ready",
      "confirmed confirmation route should expose handoff-ready artifacts",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "confirmedReceipt"));
    let artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.artifactMode === "receipt",
      "confirmed receipt artifact mode drifted",
    );
    assertCondition(
      artifactMarkers.grantState === "granted",
      "confirmed receipt should keep granted artifact posture",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "confirmedCalendar"));
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.parityPosture === "verified",
      "confirmed calendar should stay fully verified",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "confirmedBrowserHandoff"));
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.handoffReadiness === "ready",
      "confirmed browser handoff should remain ready",
    );
    assertCondition(
      await page.getByTestId("browser-handoff-panel").isVisible(),
      "confirmed browser handoff should render the governed destination summary",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "managePrint"));
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.printPosture === "ready",
      "manage print route should stay ready before print emulation",
    );
    await page.emulateMedia({ media: "print" });
    assertCondition(
      await page.evaluate(() => window.matchMedia("print").matches),
      "print emulation should become active for manage print",
    );
    await page.screenshot({
      path: outputPath("309-booking-artifact-print-ready.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await page.emulateMedia({});

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=receipt`,
    );
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.parityPosture === "recovery_only",
      "reconciliation artifact route should degrade to recovery-only parity",
    );
    assertCondition(
      artifactMarkers.grantState === "blocked",
      "reconciliation artifact route must block detached export grant",
    );
    assertCondition(
      artifactMarkers.handoffReadiness === "blocked",
      "reconciliation artifact route must block handoff readiness",
    );
    await page.screenshot({
      path: outputPath("309-booking-artifact-recovery-only.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "embeddedPrint"));
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.printPosture === "summary_only",
      "embedded print should degrade to summary-only posture",
    );
    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "embeddedBrowserHandoff"));
    artifactMarkers = await readArtifactMarkers(page);
    assertCondition(
      artifactMarkers.grantState === "summary_only",
      "embedded browser handoff should not keep granted external state",
    );
    assertCondition(
      artifactMarkers.handoffReadiness === "summary_only",
      "embedded browser handoff should remain summary-only",
    );
    assertCondition(
      await page.getByTestId("artifact-embedded-note").isVisible(),
      "embedded artifact route should render the embedded note",
    );

    await assertNoHorizontalOverflow(page, "309 artifact print and export parity");
    assertNoExternalRequests(
      "309 artifact print and export parity",
      externalRequests,
    );

    await context.tracing.stop({
      path: outputPath("309-booking-artifact-print-and-export-trace.zip"),
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
