import {
  assertCondition,
  assertNoHorizontalOverflow,
  chooseOption,
  clickPrimary,
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
    const context = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openStartRequest(page, startRequestUrl(server.baseUrl, { draft: "dft_389_flow", fixture: "empty" }));
    await page.getByRole("heading", { name: "What kind of help do you need today?" }).waitFor();
    await page.getByRole("button", { name: /Symptoms/ }).click();
    await waitForSaveState(page, "saved_authoritative");
    await clickPrimary(page);
    await page.getByTestId("EmbeddedIntakeQuestionCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedIntakeQuestionCard").getAttribute("data-step")) === "details",
      "first-run intake did not move to details",
    );
    for (let index = 0; index < 5; index += 1) {
      if (await page.getByTestId("EmbeddedContactPreferencePanel").isVisible().catch(() => false)) {
        break;
      }
      await clickPrimary(page);
      await page.waitForTimeout(250);
    }
    await page.getByTestId("EmbeddedContactPreferencePanel").waitFor();
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReviewWorkspace").waitFor();
    await assertNoHorizontalOverflow(page, "first-run embedded intake");

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_validation",
        step: "details",
        fixture: "validation",
      }),
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedValidationSummaryBar").waitFor();
    assertCondition(
      await page.getByRole("heading", { name: "There is a problem" }).isVisible(),
      "validation summary did not appear",
    );

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_submit",
        step: "review",
        fixture: "review",
      }),
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReceiptMorphFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedIntakeFrame").getAttribute("data-envelope-state")) === "submitted",
      "successful submit did not promote to submitted receipt",
    );
    await context.tracing.stop({ path: outputPath("389-submit-to-receipt-trace.zip") });
    await context.close();

    const handoffContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const handoffPage = await handoffContext.newPage();
    await openStartRequest(
      handoffPage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_handoff",
        step: "receipt",
        fixture: "receipt",
      }),
    );
    await clickPrimary(handoffPage);
    await handoffPage.getByTestId("EmbeddedPatientShellRoot").waitFor();
    assertCondition(
      (await handoffPage.getByTestId("EmbeddedPatientShellRoot").getAttribute("data-shell-mode")) === "embedded",
      "receipt did not hand off to embedded status shell",
    );
    await handoffContext.close();
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
