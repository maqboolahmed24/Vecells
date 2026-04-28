import {
  assertCondition,
  assertNoHorizontalOverflow,
  bookingArtifactUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  readArtifactMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./303_booking_artifact_parity.helpers.ts";

export const bookingArtifactParityPrintAndHandoffCoverage = [
  "browser print posture remains aligned with the artifact frame under print media emulation",
  "confirmed browser handoff keeps scrubbed destination metadata inside the same artifact route",
  "embedded artifact delivery narrows print and browser handoff to summary-only posture",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "managePrint"));
    let markers = await readArtifactMarkers(page);
    assertCondition(markers.printPosture === "ready", "manage print route should be ready before print emulation");
    await page.emulateMedia({ media: "print" });
    assertCondition(
      await page.evaluate(() => window.matchMedia("print").matches),
      "print emulation should be active",
    );
    await page.screenshot({
      path: outputPath("303-booking-artifact-print-media.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await page.emulateMedia({});

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "confirmedBrowserHandoff"));
    markers = await readArtifactMarkers(page);
    assertCondition(markers.handoffReadiness === "ready", "confirmed browser handoff should be ready in browser mode");
    assertCondition(
      await page.getByTestId("browser-handoff-panel").isVisible(),
      "browser handoff panel should render the governed destination summary",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "embeddedPrint"));
    markers = await readArtifactMarkers(page);
    assertCondition(markers.printPosture === "summary_only", "embedded print should degrade to summary-only posture");
    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "embeddedBrowserHandoff"));
    markers = await readArtifactMarkers(page);
    assertCondition(markers.grantState === "summary_only", "embedded browser handoff should not keep a granted external state");
    assertCondition(markers.handoffReadiness === "summary_only", "embedded browser handoff should remain summary-only");

    await assertNoHorizontalOverflow(page, "303 booking artifact print and handoff");
    assertCondition(
      externalRequests.size === 0,
      `artifact print and handoff routes should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("303-booking-artifact-print-and-handoff-trace.zip"),
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
