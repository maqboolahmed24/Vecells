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

const CALLBACK_FIXTURE = "fixture=callback";
const CALLBACK_DRIFTED_FIXTURE = "fixture=callback-drifted";
const MESSAGES_FIXTURE = "fixture=messages";
const RECOVERY_FIXTURE = "fixture=recovery";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: "en-GB" });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "callback", query: CALLBACK_FIXTURE }));
    await page.getByTestId("EmbeddedCallbackStatusCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedCallbackStatusCard").getAttribute("data-window-risk")) === "on_track",
      "callback fixture should be on track",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedConversationCluster").waitFor();

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "callback", query: CALLBACK_DRIFTED_FIXTURE }));
    await page.getByTestId("EmbeddedRequestRecoveryBanner").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRequestActionReserve").getAttribute("data-actionability")) ===
        "recovery_required",
      "drifted callback did not suppress live actionability",
    );

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "messages", query: MESSAGES_FIXTURE }));
    await page.getByTestId("EmbeddedConversationPreviewRow").waitFor();
    assertCondition(
      await page.getByText("Request conversation").isVisible(),
      "message-preview route did not render request-owned conversation cluster",
    );

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "recovery", query: RECOVERY_FIXTURE }));
    await page.getByTestId("EmbeddedRequestRecoveryBanner").waitFor();
    await assertNoHorizontalOverflow(page, "callback/messages/recovery");
    await context.tracing.stop({ path: outputPath("390-callback-messages-recovery-trace.zip") });
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
