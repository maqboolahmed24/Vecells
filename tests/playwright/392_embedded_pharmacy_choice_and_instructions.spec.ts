import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
  embeddedPharmacyUrl,
  importPlaywright,
  openEmbeddedPharmacy,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./392_embedded_pharmacy.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, { view: "choice", query: "fixture=choice" }),
    );
    await page.getByTestId("EmbeddedPharmacyChooser").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyFrame").getAttribute("data-choice-projection-state")) ===
        "choosing",
      "choice projection should be choosing",
    );
    await page.getByTestId("EmbeddedPharmacyChoiceRow").first().locator("button").click();
    await clickPrimary(page);
    await page.getByTestId("EmbeddedPharmacyInstructionsPanel").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyFrame").getAttribute("data-route-key")) ===
        "instructions",
      "choice primary action did not route to pharmacy instructions",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedChosenPharmacyCard").textContent())?.includes("Cedar Pharmacy"),
      "chosen provider summary did not persist on instructions",
    );
    await assertNoHorizontalOverflow(page, "choice to instructions");
    await context.tracing.stop({ path: outputPath("392-choice-to-instructions-trace.zip") });
  } finally {
    await context.close();
    await browser.close();
    await stopPatientWeb(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

