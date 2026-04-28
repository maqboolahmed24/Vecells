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

const STATUS_FIXTURE = "fixture=status";
const MORE_INFO_FIXTURE = "fixture=more-info";

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
    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "status", query: STATUS_FIXTURE }));
    await page.getByTestId("EmbeddedRequestHeaderSummary").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRequestActionReserve").getAttribute("data-actionability")) === "live",
      "status fixture should expose live reply actionability",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoResponseFlow").waitFor();
    await assertNoHorizontalOverflow(page, "status to more-info");

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "more-info", query: MORE_INFO_FIXTURE }));
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoValidation").waitFor();
    assertCondition(
      await page.getByText("There is a problem").isVisible(),
      "empty reply did not show validation",
    );
    await page.locator("#embedded-more-info-reply").fill("Photo taken Monday morning in daylight.");
    await clickPrimary(page);
    await page.getByTestId("EmbeddedMoreInfoSubmitted").waitFor();
    assertCondition(
      await page.getByText("Reply held for review").isVisible(),
      "reply did not settle into same-shell submitted state",
    );
    await context.tracing.stop({ path: outputPath("390-status-to-reply-trace.zip") });
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
