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

export const bookingArtifactParityCoverage = [
  "confirmation artifact actions reopen through one governed artifact host",
  "manage print and directions actions resolve through the same artifact route instead of local stubs",
  "summary-only and blocked postures keep the receipt visible without overclaiming handoff readiness",
  "artifact route stays same-shell and continuity-safe without external requests",
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

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByRole("button", { name: /Export to calendar/i }).click();
    await page.waitForURL(/\/bookings\/booking_case_296_confirmed\/artifacts/);
    let markers = await readArtifactMarkers(page);
    assertCondition(markers.artifactSource === "confirm", "confirmation artifact route should preserve confirm source");
    assertCondition(markers.artifactMode === "calendar", "confirmation artifact route should open calendar mode");
    assertCondition(markers.grantState === "granted", "confirmed calendar artifact should be granted in browser mode");
    await page.getByTestId("artifact-return-to-source").click();
    await page.waitForURL(/\/bookings\/booking_case_296_confirmed\/confirm/);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("manage-artifact-action-0").click();
    await page.waitForURL(/artifactMode=print/);
    markers = await readArtifactMarkers(page);
    assertCondition(markers.artifactSource === "manage", "manage artifact route should preserve manage source");
    assertCondition(markers.printPosture === "ready", "manage print artifact should be print-ready");
    await page.getByTestId("artifact-mode-directions").click();
    await page.waitForURL(/artifactMode=directions/);
    markers = await readArtifactMarkers(page);
    assertCondition(markers.artifactMode === "directions", "artifact mode toggle should switch to directions");
    assertCondition(markers.handoffReadiness === "ready", "directions handoff should stay ready for confirmed manage posture");

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "pendingPrint"));
    markers = await readArtifactMarkers(page);
    assertCondition(markers.parityPosture === "summary_only", "pending artifact should remain summary-only");
    assertCondition(markers.grantState === "summary_only", "pending artifact should not arm external grant");
    assertCondition(
      await page.getByTestId("printable-appointment-view").isVisible(),
      "pending artifact route should still render the in-shell print summary",
    );

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "staleReceipt"));
    markers = await readArtifactMarkers(page);
    assertCondition(markers.parityPosture === "recovery_only", "stale manage artifact should downgrade to recovery-only parity");
    assertCondition(markers.grantState === "blocked", "stale manage artifact should block handoff grant");

    await assertNoHorizontalOverflow(page, "303 booking artifact parity desktop");
    assertCondition(
      externalRequests.size === 0,
      `artifact route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("303-booking-artifact-parity-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("303-booking-artifact-parity-trace.zip"),
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
