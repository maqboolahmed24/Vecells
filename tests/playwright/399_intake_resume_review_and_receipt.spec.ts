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
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, { draft: "dft_399_flow", fixture: "empty" }),
    );
    await page.getByRole("button", { name: /Symptoms/ }).click();
    await waitForSaveState(page, "saved_authoritative");
    await clickPrimary(page);
    await page.getByTestId("EmbeddedIntakeQuestionCard").waitFor();
    for (let index = 0; index < 5; index += 1) {
      if (
        await page
          .getByTestId("EmbeddedContactPreferencePanel")
          .isVisible()
          .catch(() => false)
      ) {
        break;
      }
      await clickPrimary(page);
      await page.waitForTimeout(200);
    }
    await page.getByTestId("EmbeddedContactPreferencePanel").waitFor();
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReviewWorkspace").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedIntakeFrame").getAttribute("data-envelope-state")) ===
        "review_ready",
      "intake did not reach review-ready state",
    );
    await assertNoHorizontalOverflow(page, "399 embedded intake review");

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_399_submit",
        step: "review",
        fixture: "review",
      }),
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReceiptMorphFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedIntakeFrame").getAttribute("data-envelope-state")) ===
        "submitted",
      "review did not promote to submitted receipt",
    );
    await context.tracing.stop({ path: outputPath("399-intake-continuity-trace.zip") });
    await context.close();

    const resumeContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
    });
    await resumeContext.tracing.start({ screenshots: true, snapshots: true });
    const resumePage = await resumeContext.newPage();
    await openStartRequest(
      resumePage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_399_resume",
        step: "details",
        fixture: "validation",
      }),
    );
    await chooseOption(resumePage, "Fit note");
    await waitForSaveState(resumePage, "saved_authoritative");
    await openStartRequest(
      resumePage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_399_resume",
        step: "details",
      }),
    );
    assertCondition(
      await resumePage
        .locator("label")
        .filter({ hasText: "Fit note" })
        .locator("input")
        .first()
        .isChecked(),
      "resumed draft did not restore saved answer",
    );

    await openStartRequest(
      resumePage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_399_promoted",
        step: "resume",
        fixture: "promoted",
      }),
    );
    await resumePage.getByTestId("EmbeddedResumeDraftBanner").waitFor();
    assertCondition(
      (await resumePage.getByTestId("EmbeddedIntakeFrame").getAttribute("data-envelope-state")) ===
        "promoted_recovery",
      "promoted draft did not enter recovery",
    );
    assertCondition(
      !(await resumePage
        .getByTestId("EmbeddedIntakeQuestionCard")
        .isVisible()
        .catch(() => false)),
      "promoted draft reopened editable fields",
    );
    await resumeContext.tracing.stop({ path: outputPath("399-intake-resume-promoted-trace.zip") });
    await resumeContext.close();
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
