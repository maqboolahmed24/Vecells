import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
  importPlaywright,
  openStartRequest,
  startPatientWeb,
  startRequestUrl,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./389_embedded_start_request.helpers.ts";

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
    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_a11y",
        step: "details",
        fixture: "validation",
      }),
    );
    await clickPrimary(page);
    const validation = page.getByTestId("EmbeddedValidationSummaryBar");
    await validation.waitFor();
    const validationSnapshot = await writeAriaSnapshot(
      validation,
      "389-embedded-start-request-validation.aria.yml",
    );
    assertCondition(validationSnapshot.includes("There is a problem"), "validation ARIA snapshot missing heading");
    assertCondition(validationSnapshot.includes("Answer this question"), "validation ARIA snapshot missing issue");

    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    assertCondition(focusedText.includes("There is a problem"), "validation summary did not receive focus");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedSubmitActionBar"),
      "389-embedded-start-request-action-bar.aria.yml",
    );
    assertCondition(actionSnapshot.includes("Save and continue"), "action bar ARIA snapshot missing primary action");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 5, `expected labelled embedded intake landmarks, found ${landmarkCount}`);
    assertCondition((await page.locator("main").count()) === 1, "embedded intake should expose one main landmark");

    const actionBox = await page.getByTestId("EmbeddedSubmitActionBar").boundingBox();
    assertCondition(Boolean(actionBox && actionBox.y + actionBox.height <= 844), "sticky action reserve below viewport");
    await assertNoHorizontalOverflow(page, "embedded start request accessibility");
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
