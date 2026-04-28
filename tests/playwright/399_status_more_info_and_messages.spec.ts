import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
  embeddedRequestUrl,
  importPlaywright,
  openEmbeddedRequest,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./390_embedded_request.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    locale: "en-GB",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedRequest(
      page,
      embeddedRequestUrl(server.baseUrl, { view: "status", query: "fixture=status" }),
    );
    const statusRoot = page.getByTestId("EmbeddedRequestStatusFrame");
    assertCondition(
      (await statusRoot.getAttribute("data-continuity-state")) === "preserved",
      "status route continuity not preserved",
    );
    assertCondition(
      (await page
        .getByTestId("EmbeddedRequestActionReserve")
        .getAttribute("data-actionability")) === "live",
      "status route should expose live actionability",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoResponseFlow").waitFor();

    await openEmbeddedRequest(
      page,
      embeddedRequestUrl(server.baseUrl, { view: "more-info", query: "fixture=more-info" }),
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoValidation").waitFor();
    assertCondition(
      await page.getByText("There is a problem").isVisible(),
      "more-info validation summary missing",
    );
    await page.locator("#embedded-more-info-reply").fill("Photo taken Monday morning in daylight.");
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoSubmitted").waitFor();
    assertCondition(
      await page.getByText("Reply held for review").isVisible(),
      "more-info reply did not settle",
    );

    await openEmbeddedRequest(
      page,
      embeddedRequestUrl(server.baseUrl, { view: "callback", query: "fixture=callback" }),
    );
    await page.getByTestId("EmbeddedCallbackStatusCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedCallbackStatusCard").getAttribute("data-window-risk")) ===
        "on_track",
      "callback should be on track",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedConversationCluster").waitFor();

    await openEmbeddedRequest(
      page,
      embeddedRequestUrl(server.baseUrl, { view: "messages", query: "fixture=messages" }),
    );
    await page.getByTestId("EmbeddedConversationPreviewRow").waitFor();
    assertCondition(
      await page.getByText("Request conversation").isVisible(),
      "message thread did not render",
    );

    await openEmbeddedRequest(
      page,
      embeddedRequestUrl(server.baseUrl, { view: "callback", query: "fixture=callback-drifted" }),
    );
    await page.getByTestId("EmbeddedRequestRecoveryBanner").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedRequestActionReserve")
        .getAttribute("data-actionability")) === "recovery_required",
      "callback drift did not suppress live actionability",
    );
    await assertNoHorizontalOverflow(page, "399 status more-info messages");
    await context.tracing.stop({ path: outputPath("399-status-message-continuity-trace.zip") });
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
