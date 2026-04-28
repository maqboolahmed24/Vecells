import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedRequestUrl,
  importPlaywright,
  openEmbeddedRequest,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./390_embedded_request.helpers.ts";

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
    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "status", query: "fixture=status" }));
    const timelineSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedRequestStatusTimeline"),
      "390-embedded-request-timeline.aria.yml",
    );
    assertCondition(timelineSnapshot.includes("What is happening"), "timeline ARIA snapshot missing heading");
    assertCondition(timelineSnapshot.includes("More information"), "timeline ARIA snapshot missing more-info row");

    const summarySnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedRequestHeaderSummary"),
      "390-embedded-request-summary.aria.yml",
    );
    assertCondition(summarySnapshot.includes("Next safe action"), "summary ARIA snapshot missing next action");
    assertCondition(summarySnapshot.includes("Reply needed"), "summary ARIA snapshot missing status");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedRequestActionReserve"),
      "390-embedded-request-action-reserve.aria.yml",
    );
    assertCondition(actionSnapshot.includes("Reply with more information"), "action reserve ARIA snapshot missing primary action");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 6, `expected labelled embedded request landmarks, found ${landmarkCount}`);
    assertCondition((await page.locator("main").count()) === 1, "embedded request route should expose one main landmark");
    const actionBox = await page.getByTestId("EmbeddedRequestActionReserve").boundingBox();
    assertCondition(Boolean(actionBox && actionBox.y + actionBox.height <= 844), "sticky action reserve below viewport");
    await assertNoHorizontalOverflow(page, "embedded request accessibility");
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
