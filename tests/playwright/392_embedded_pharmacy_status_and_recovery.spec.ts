import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
  embeddedPharmacyUrl,
  importPlaywright,
  openEmbeddedPharmacy,
  startPatientWeb,
  stopPatientWeb,
} from "./392_embedded_pharmacy.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
  const page = await context.newPage();

  try {
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
      (await page.getByTestId("EmbeddedPharmacyActionReserve").getAttribute("data-actionability")) ===
        "read_only",
      "dispatch pending status should be read-only",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyFrame").getAttribute("data-dispatch-proof-state")) ===
        "pending",
      "pending dispatch proof should be visible",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedPharmacyOutcomeCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyFrame").getAttribute("data-outcome-truth")) ===
        "settled_resolved",
      "status primary action should route to completed outcome fixture",
    );

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, {
        pharmacyCaseId: "PHC-2103",
        view: "recovery",
        query: "fixture=urgent-return",
      }),
    );
    await page.getByTestId("EmbeddedUrgentReturnRecoveryCard").first().waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedPharmacyActionReserve").getAttribute("data-actionability")) ===
        "recovery_required",
      "urgent return should require recovery",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedChosenPharmacyCard").textContent())?.includes("Riverside Pharmacy"),
      "urgent recovery should preserve chosen provider context",
    );
    await assertNoHorizontalOverflow(page, "status and recovery");
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

