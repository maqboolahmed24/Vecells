import {
  assertCondition,
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

export const patientNetworkAlternativeChoiceCoverage = [
  "live open-choice route shows the full current set with no preselected card",
  "accept path records explicit patient choice without pretending confirmation already happened",
  "callback remains separate from ranked rows and can be requested explicitly",
  "decline-all preserves callback as a separate fallback path",
  "contact-route repair reopens the regenerated set with the preserved selected anchor",
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
    const acceptContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await acceptContext.tracing.start({ screenshots: true, snapshots: true });
    const acceptPage = await acceptContext.newPage();
    trackExternalRequests(acceptPage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      acceptPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    const liveMarkers = await readNetworkChoiceMarkers(acceptPage);
    assertCondition(
      liveMarkers.choiceActionability === "live_open_choice",
      "live route should expose live open choice posture",
    );
    assertCondition(
      liveMarkers.selectedOfferEntry === "",
      "live route should not preselect an option on first entry",
    );
    assertCondition(
      (await acceptPage.locator("[data-offer-card]").count()) === 4,
      "live route should render the full visible offer set",
    );
    assertCondition(
      (await acceptPage.locator("[role='radiogroup'] [data-callback-fallback]").count()) === 0,
      "callback card must remain outside the ranked radiogroup",
    );

    await acceptPage
      .locator("[data-offer-card='offer_entry_328_wharf_1910'] .patient-network-choice__card-button")
      .click();
    await waitForNetworkChoiceState(acceptPage, {
      selectedOfferEntry: "offer_entry_328_wharf_1910",
    });
    assertCondition(
      (await acceptPage
        .locator("[data-offer-card='offer_entry_328_wharf_1910'] [role='radio']")
        .getAttribute("aria-checked")) === "true",
      "selected offer card should publish checked radio state",
    );

    await acceptPage.getByRole("button", { name: "Accept this option" }).click();
    await waitForNetworkChoiceState(acceptPage, {
      offerState: "selected",
      choiceActionability: "blocked",
      confirmationTruth: "confirmation_pending",
      patientVisibility: "provisional_receipt",
    });
    const acceptAnnouncement = (
      await acceptPage.getByTestId("patient-network-choice-live-region").textContent()
    )?.trim();
    assertCondition(
      acceptAnnouncement === "Choice recorded. Confirmation is now pending.",
      `unexpected accept live-region text: ${String(acceptAnnouncement)}`,
    );
    await acceptContext.tracing.stop({
      path: outputPath("328-network-choice-accept-trace.zip"),
    });
    await acceptContext.close();

    const callbackContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const callbackPage = await callbackContext.newPage();
    trackExternalRequests(callbackPage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      callbackPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    await callbackPage.getByRole("button", { name: "Request callback instead" }).click();
    await waitForNetworkChoiceState(callbackPage, {
      fallbackLinkState: "callback_pending_link",
      choiceActionability: "fallback_only",
      patientVisibility: "fallback_visible",
    });
    assertCondition(
      (await callbackPage
        .getByTestId("callback-fallback-card")
        .getAttribute("data-selection-state")) === "selected",
      "callback request should keep the fallback card visibly selected",
    );
    await callbackContext.close();

    const declineContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const declinePage = await declineContext.newPage();
    trackExternalRequests(declinePage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      declinePage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    await declinePage.getByRole("button", { name: "Decline these times" }).click();
    await waitForNetworkChoiceState(declinePage, {
      offerState: "declined",
      choiceActionability: "fallback_only",
      patientVisibility: "fallback_visible",
    });
    assertCondition(
      await declinePage.getByTestId("callback-fallback-card").isVisible(),
      "decline-all should preserve the separate callback card",
    );
    await declineContext.close();

    const recoveryContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await recoveryContext.tracing.start({ screenshots: true, snapshots: true });
    const recoveryPage = await recoveryContext.newPage();
    trackExternalRequests(recoveryPage, baseUrl, externalRequests);

    await openNetworkChoiceRoute(
      recoveryPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_contact_repair",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    const repairMarkers = await readNetworkChoiceMarkers(recoveryPage);
    assertCondition(
      repairMarkers.recoveryReason === "contact_route_repair" &&
        repairMarkers.selectedOfferEntry === "offer_entry_328_wharf_1910",
      "contact repair route should preserve the selected anchor in place",
    );
    await recoveryPage.getByRole("button", { name: "Repair contact route" }).click();
    await waitForNetworkChoiceState(recoveryPage, {
      offerSession: "offer_session_328_regenerated",
      choiceActionability: "live_open_choice",
      selectedOfferEntry: "offer_entry_328_wharf_1910",
    });
    const regeneratedMarkers = await readNetworkChoiceMarkers(recoveryPage);
    assertCondition(
      regeneratedMarkers.selectedAnchorRef === "offer_entry_328_wharf_1910",
      "regenerated route should preserve the selected anchor ref",
    );
    await recoveryContext.tracing.stop({
      path: outputPath("328-network-choice-recovery-trace.zip"),
    });
    await recoveryContext.close();

    assertCondition(
      externalRequests.size === 0,
      `network choice route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
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
