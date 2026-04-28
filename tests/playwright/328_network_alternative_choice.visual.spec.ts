import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  networkChoiceUrl,
  openNetworkChoiceRoute,
  outputPath,
  startNetworkChoiceAtlasServer,
  startPatientWeb,
  stopPatientWeb,
} from "./328_network_alternative_choice.helpers.ts";

export const patientNetworkAlternativeChoiceVisualCoverage = [
  "desktop live open-choice screenshot",
  "desktop contact-route repair screenshot",
  "mobile embedded screenshot",
  "static atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const atlas = await startNetworkChoiceAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
    await openNetworkChoiceRoute(
      desktop,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    await desktop.screenshot({
      path: outputPath("328-network-choice-desktop-live.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(desktop, "328 desktop live route");

    const repair = await browser.newPage({ viewport: { width: 1366, height: 1120 } });
    await openNetworkChoiceRoute(
      repair,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_contact_repair",
        origin: "requests",
        returnRoute: "/requests",
      }),
    );
    await repair.screenshot({
      path: outputPath("328-network-choice-desktop-repair.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(repair, "328 desktop repair route");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openNetworkChoiceRoute(
      mobile,
      networkChoiceUrl(baseUrl, {
        scenarioId: "offer_session_328_live",
        origin: "requests",
        returnRoute: "/requests",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    await mobile
      .locator("[data-offer-card='offer_entry_328_wharf_1910'] .patient-network-choice__card-button")
      .click();
    await mobile.getByTestId("network-choice-sticky-tray").waitFor();
    await mobile.screenshot({
      path: outputPath("328-network-choice-mobile-embedded.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(mobile, "328 mobile embedded route");

    const atlasPage = await browser.newPage({ viewport: { width: 1540, height: 1200 } });
    await atlasPage.goto(atlas.atlasUrl, { waitUntil: "networkidle" });
    const atlasRoot = atlasPage.locator("[data-testid='PatientNetworkAlternativeChoiceAtlas']");
    await atlasRoot.waitFor();
    assertCondition(
      (await atlasRoot.getAttribute("data-visual-mode")) === "Patient_Network_Open_Choice",
      "atlas visual mode drifted",
    );
    await atlasPage.screenshot({
      path: outputPath("328-network-choice-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    await browser.close();
    await closeServer(atlas.server);
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
