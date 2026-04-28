import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  networkChoiceUrl,
  openNetworkChoiceRoute,
  outputPath,
  readNetworkChoiceMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  waitForNetworkChoiceState,
} from "./328_network_alternative_choice.helpers.ts";

export const patientNetworkAlternativeChoiceEmbeddedCoverage = [
  "embedded NHS App host suppresses browser chrome without changing route semantics",
  "folded mobile layout exposes the sticky action tray only after explicit selection",
  "embedded drift keeps provenance visible and can reopen the current set with the preserved anchor",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const liveContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    await liveContext.tracing.start({ screenshots: true, snapshots: true });
    const livePage = await liveContext.newPage();
    trackExternalRequests(livePage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      livePage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    const liveMarkers = await readNetworkChoiceMarkers(livePage);
    assertCondition(
      liveMarkers.embeddedMode === "nhs_app" && liveMarkers.safeAreaClass === "bottom",
      "embedded live route should publish nhs_app mode and bottom safe area",
    );
    assertCondition(
      (await livePage.getByTestId("patient-booking-top-band").count()) === 0,
      "embedded live route should suppress the browser top band",
    );
    await livePage.getByTestId("embedded-booking-host-ribbon").waitFor();

    await livePage
      .locator("[data-offer-card='offer_entry_328_wharf_1910'] .patient-network-choice__card-button")
      .click();
    await waitForNetworkChoiceState(livePage, {
      selectedOfferEntry: "offer_entry_328_wharf_1910",
      embeddedMode: "nhs_app",
    });
    await livePage.getByTestId("network-choice-sticky-tray").waitFor();
    const stickyPrimary = livePage.getByTestId("network-choice-sticky-primary-action");
    await stickyPrimary.scrollIntoViewIfNeeded();
    await stickyPrimary.focus();
    const stickyFullyVisible = await stickyPrimary.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assertCondition(
      stickyFullyVisible,
      "sticky primary action should remain fully visible inside the mobile viewport",
    );
    await assertNoHorizontalOverflow(livePage, "328 embedded live route");
    await liveContext.tracing.stop({
      path: outputPath("328-network-choice-embedded-live-trace.zip"),
    });
    await liveContext.close();

    const driftContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const driftPage = await driftContext.newPage();
    trackExternalRequests(driftPage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      driftPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_embedded_drift",
        origin: "requests",
        returnRoute: "/requests",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    const driftMarkers = await readNetworkChoiceMarkers(driftPage);
    assertCondition(
      driftMarkers.recoveryReason === "embedded_drift" &&
        driftMarkers.choiceActionability === "blocked" &&
        driftMarkers.selectedOfferEntry === "offer_entry_328_wharf_1910",
      "embedded drift route should preserve the selected anchor in blocked posture",
    );
    assertCondition(
      await driftPage.getByTestId("alternative-offer-provenance-stub").isVisible(),
      "embedded drift should show provenance instead of a generic error page",
    );
    await driftPage.getByRole("button", { name: "Open current choice set" }).click();
    await waitForNetworkChoiceState(driftPage, {
      offerSession: "offer_session_328_regenerated",
      embeddedMode: "nhs_app",
      selectedOfferEntry: "offer_entry_328_wharf_1910",
    });
    const regeneratedMarkers = await readNetworkChoiceMarkers(driftPage);
    assertCondition(
      regeneratedMarkers.choiceActionability === "live_open_choice",
      "embedded recovery should reopen the regenerated live set",
    );
    await assertNoHorizontalOverflow(driftPage, "328 embedded recovery route");
    await driftContext.close();

    assertCondition(
      externalRequests.size === 0,
      `embedded network choice route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );
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
