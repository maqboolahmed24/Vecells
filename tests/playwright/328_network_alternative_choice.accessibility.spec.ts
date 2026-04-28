import {
  assertCondition,
  captureAria,
  importPlaywright,
  networkChoiceUrl,
  openNetworkChoiceRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  waitForNetworkChoiceState,
  writeJsonArtifact,
} from "./328_network_alternative_choice.helpers.ts";

export const patientNetworkAlternativeChoiceAccessibilityCoverage = [
  "radiogroup structure and keyboard navigation",
  "logical tab order from ranked choice to callback, decline, and decision rail",
  "aria snapshots for live and stale-link provenance states",
  "reduced-motion marker and transition collapse",
];

async function nextActionRef(page: any, maxTabs = 12): Promise<string | null> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const actionRef = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.getAttribute("data-action-ref") ?? active?.closest("[data-action-ref]")?.getAttribute("data-action-ref") ?? null;
    });
    if (actionRef) {
      return actionRef;
    }
  }
  return null;
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const normalContext = await browser.newContext({
      viewport: { width: 1400, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await normalContext.tracing.start({ screenshots: true, snapshots: true });
    const normalPage = await normalContext.newPage();

    await openNetworkChoiceRoute(
      normalPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    assertCondition((await normalPage.locator("nav").count()) >= 1, "route lost navigation landmark");
    assertCondition((await normalPage.locator("main").count()) === 1, "route should keep one main landmark");
    assertCondition(
      (await normalPage.locator("[role='radiogroup']").count()) === 1,
      "live route should expose one radiogroup",
    );
    assertCondition(
      (await normalPage.locator("[role='radio']").count()) === 4,
      "live route should expose four radio options",
    );

    const firstRadio = normalPage
      .locator("[data-offer-card='offer_entry_328_riverside_1830'] .patient-network-choice__card-button");
    await firstRadio.focus();
    await normalPage.keyboard.press("ArrowDown");
    await waitForNetworkChoiceState(normalPage, {
      selectedOfferEntry: "offer_entry_328_wharf_1910",
    });
    const liveAnnouncement = (
      await normalPage.getByTestId("patient-network-choice-live-region").textContent()
    )?.trim();
    assertCondition(
      liveAnnouncement?.includes("North Wharf hub"),
      "selection change should update the live region with the selected site",
    );

    const callbackAction = await nextActionRef(normalPage);
    assertCondition(
      callbackAction === "request_callback",
      `expected callback action after selected radio, got ${String(callbackAction)}`,
    );
    const declineAction = await nextActionRef(normalPage);
    assertCondition(
      declineAction === "decline_all_offers",
      `expected decline-all action after callback, got ${String(declineAction)}`,
    );
    const acceptAction = await nextActionRef(normalPage);
    assertCondition(
      acceptAction === "accept_alternative_offer",
      `expected accept action in decision rail, got ${String(acceptAction)}`,
    );

    const liveAria = await captureAria(
      normalPage.locator("[data-testid='Patient_Network_Alternative_Choice_Route']"),
      normalPage,
    );
    await normalContext.tracing.stop({
      path: outputPath("328-network-choice-accessibility-trace.zip"),
    });
    await normalContext.close();

    const staleContext = await browser.newContext({
      viewport: { width: 1400, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const stalePage = await staleContext.newPage();
    await openNetworkChoiceRoute(
      stalePage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_stale_link",
        origin: "secure_link",
        returnRoute: "/requests",
      }),
    );
    const staleAria = await captureAria(
      stalePage.locator("[data-testid='Patient_Network_Alternative_Choice_Route']"),
      stalePage,
    );
    writeJsonArtifact("328-network-choice-aria-snapshots.json", {
      live: liveAria,
      staleLink: staleAria,
    });
    await staleContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openNetworkChoiceRoute(
      reducedPage,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    const reducedRoot = reducedPage.getByTestId("Patient_Network_Alternative_Choice_Route");
    assertCondition(
      (await reducedRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced-motion root marker drifted",
    );
    const transitionDuration = await reducedPage
      .locator("[data-offer-card='offer_entry_328_riverside_1830']")
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      transitionDuration.includes("0s") ||
        transitionDuration.includes("0.01ms") ||
        transitionDuration.includes("1e-05s"),
      `card transitions did not collapse under reduced motion: ${transitionDuration}`,
    );
    await reducedContext.close();
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
