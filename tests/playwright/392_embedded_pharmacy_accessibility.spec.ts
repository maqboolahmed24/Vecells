import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedPharmacyUrl,
  importPlaywright,
  openEmbeddedPharmacy,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./392_embedded_pharmacy.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, { view: "choice", query: "fixture=warned-choice" }),
    );
    const chooserSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedPharmacyChooser"),
      "392-embedded-pharmacy-chooser.aria.yml",
    );
    assertCondition(chooserSnapshot.includes("Pharmacy choice"), "chooser ARIA snapshot missing heading");
    assertCondition(chooserSnapshot.includes("Choose this pharmacy"), "chooser ARIA snapshot missing row action");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedPharmacyActionReserve"),
      "392-embedded-pharmacy-action-reserve.aria.yml",
    );
    assertCondition(actionSnapshot.includes("Choose a pharmacy to continue"), "action ARIA snapshot missing primary action");

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, {
        pharmacyCaseId: "PHC-2184",
        view: "instructions",
        query: "fixture=referral-sent",
      }),
    );
    const instructionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedPharmacyInstructionsPanel"),
      "392-embedded-pharmacy-instructions.aria.yml",
    );
    assertCondition(instructionSnapshot.includes("Instructions"), "instructions ARIA snapshot missing heading");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 5, `expected labelled embedded pharmacy landmarks, found ${landmarkCount}`);
    assertCondition((await page.locator("main").count()) === 1, "embedded pharmacy route should expose one main landmark");
    const actionRect = await page.getByTestId("EmbeddedPharmacyActionReserve").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "sticky action reserve below viewport");
    await assertNoHorizontalOverflow(page, "embedded pharmacy accessibility");
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

