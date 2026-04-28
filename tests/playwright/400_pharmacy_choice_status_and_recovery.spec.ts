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
  const embeddedContext = await browser.newContext({
    viewport: { width: 430, height: 900 },
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await embeddedContext.tracing.start({ screenshots: true, snapshots: true });
  const page = await embeddedContext.newPage();

  try {
    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, { view: "choice", query: "fixture=choice" }),
    );
    await page.getByTestId("EmbeddedPharmacyChooser").waitFor();
    await page.getByTestId("EmbeddedPharmacyChoiceRow").first().locator("button").click();
    await clickPrimary(page);
    await page.getByTestId("EmbeddedPharmacyInstructionsPanel").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedChosenPharmacyCard").textContent())?.includes(
        "Cedar Pharmacy",
      ),
      "chosen provider did not persist into instructions",
    );

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, {
        pharmacyCaseId: "PHC-2057",
        view: "status",
        query: "fixture=dispatch-pending",
      }),
    );
    await page.getByTestId("EmbeddedReferralStatusSurface").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedPharmacyActionReserve")
        .getAttribute("data-actionability")) === "read_only",
      "pending dispatch status should be read-only",
    );
    assertCondition(
      (await page
        .getByTestId("EmbeddedPharmacyFrame")
        .getAttribute("data-dispatch-proof-state")) === "pending",
      "pending dispatch proof was not visible",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedPharmacyOutcomeCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyFrame").getAttribute("data-outcome-truth")) ===
        "settled_resolved",
      "status did not route to settled outcome",
    );

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, {
        pharmacyCaseId: "PHC-2103",
        view: "recovery",
        query: "fixture=urgent-return",
      }),
    );
    await page.getByTestId("EmbeddedUrgentReturnRecoveryCard").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedPharmacyActionReserve")
        .getAttribute("data-actionability")) === "recovery_required",
      "urgent return did not require recovery",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedChosenPharmacyCard").textContent())?.includes(
        "Riverside Pharmacy",
      ),
      "urgent recovery did not preserve chosen provider",
    );
    await assertNoHorizontalOverflow(page, "400 pharmacy embedded status recovery");
    await embeddedContext.tracing.stop({
      path: outputPath("400-pharmacy-choice-status-recovery-trace.zip"),
    });
    await embeddedContext.close();

    const browserSizedContext = await browser.newContext({
      viewport: { width: 1024, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const browserSizedPage = await browserSizedContext.newPage();
    await openEmbeddedPharmacy(
      browserSizedPage,
      embeddedPharmacyUrl(server.baseUrl, {
        pharmacyCaseId: "PHC-2057",
        view: "status",
        query: "fixture=dispatch-pending",
      }),
    );
    await browserSizedPage.getByTestId("EmbeddedReferralStatusSurface").waitFor();
    assertCondition(
      (await browserSizedPage
        .getByTestId("EmbeddedPharmacyFrame")
        .getAttribute("data-dispatch-proof-state")) === "pending",
      "browser-sized status contradicted embedded pending truth",
    );
    await browserSizedContext.close();
  } finally {
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
