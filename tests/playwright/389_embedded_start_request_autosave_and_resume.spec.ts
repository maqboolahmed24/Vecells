import {
  assertCondition,
  chooseOption,
  importPlaywright,
  openStartRequest,
  outputPath,
  startPatientWeb,
  startRequestUrl,
  stopPatientWeb,
  waitForSaveState,
} from "./389_embedded_start_request.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: "en-GB" });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_autosave",
        step: "details",
        fixture: "validation",
      }),
    );
    await chooseOption(page, "Fit note");
    await waitForSaveState(page, "saved_authoritative");
    assertCondition(
      (await page.getByTestId("EmbeddedDraftSaveChip").getAttribute("data-save-state")) === "saved_authoritative",
      "EmbeddedDraftSaveChip did not settle to authoritative saved state",
    );

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_autosave",
        step: "details",
      }),
    );
    assertCondition(await page.locator("label").filter({ hasText: "Fit note" }).locator("input").first().isChecked(), "resumed draft did not keep saved answer");
    await context.tracing.stop({ path: outputPath("389-autosave-resume-trace.zip") });
    await context.close();

    const promotedContext = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: "en-GB" });
    await promotedContext.tracing.start({ screenshots: true, snapshots: true });
    const promotedPage = await promotedContext.newPage();
    await openStartRequest(
      promotedPage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_promoted",
        step: "resume",
        fixture: "promoted",
      }),
    );
    const banner = promotedPage.getByTestId("EmbeddedResumeDraftBanner");
    await banner.waitFor();
    assertCondition(
      (await promotedPage.getByTestId("EmbeddedIntakeFrame").getAttribute("data-envelope-state")) ===
        "promoted_recovery",
      "promoted draft did not enter promoted recovery envelope state",
    );
    await banner.getByRole("button", { name: "Open receipt" }).click();
    await promotedPage.getByTestId("EmbeddedReceiptMorphFrame").waitFor();
    assertCondition(
      !(await promotedPage.getByTestId("EmbeddedIntakeQuestionCard").isVisible().catch(() => false)),
      "promoted recovery reopened editable questions",
    );
    await promotedContext.tracing.stop({ path: outputPath("389-promoted-draft-recovery-trace.zip") });
    await promotedContext.close();
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
