import {
  assertCondition,
  assertNoHorizontalOverflow,
  assertNoRawPlumbing,
  entryUrl,
  importPlaywright,
  openEntryRoute,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./388_embedded_entry.helpers.ts";

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
  const consoleMessages: string[] = [];
  page.on("console", (message: any) => consoleMessages.push(message.text()));

  try {
    await openEntryRoute(
      page,
      entryUrl(server.baseUrl, {
        entry: "confirming",
        route: "request_status",
        rawHandoff: true,
      }),
    );
    const stateSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedEntryStatusCard"),
      "388-embedded-entry-state-card.aria.yml",
    );
    assertCondition(stateSnapshot.includes("Confirming your details"), "state card ARIA snapshot missing heading");
    assertCondition(stateSnapshot.includes("Journey"), "state card ARIA snapshot missing journey row");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedEntryActionCluster"),
      "388-embedded-entry-action-cluster.aria.yml",
    );
    assertCondition(
      actionSnapshot.includes("Waiting for confirmation"),
      "action cluster ARIA snapshot missing disabled primary action",
    );

    const focusedHeading = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    assertCondition(focusedHeading.includes("Confirming your details"), "posture heading did not receive focus");

    await page.keyboard.press("Tab");
    const focusedLabel = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.getAttribute("aria-label") ?? element?.textContent ?? "";
    });
    assertCondition(focusedLabel.trim().length > 0, "keyboard focus did not reach an operable control");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 5, `expected labelled entry landmarks, found ${landmarkCount}`);
    assertCondition(
      (await page.locator("main").count()) === 1,
      "entry corridor should expose exactly one main landmark",
    );
    await assertNoRawPlumbing(page, "accessibility entry", consoleMessages);
    await assertNoHorizontalOverflow(page, "accessibility entry corridor");
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
