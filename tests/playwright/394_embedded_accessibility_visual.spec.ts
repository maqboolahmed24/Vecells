import fs from "node:fs";

import {
  assertCondition,
  embeddedA11yRouteFamilies,
  importPlaywright,
  openEmbeddedA11yRoute,
  outputPath,
  runEmbeddedA11yEquivalentAssertions,
  startPatientWeb,
  stopPatientWeb,
} from "./394_embedded_accessibility.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-GB",
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    for (const routeFamily of embeddedA11yRouteFamilies) {
      await openEmbeddedA11yRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedA11yEquivalentAssertions(page, `${routeFamily} visual`);
      await page.locator(".embedded-a11y button:not([disabled])").first().focus();
      const screenshot = outputPath(`394-${routeFamily}-embedded-a11y-mobile.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      const stat = fs.statSync(screenshot);
      assertCondition(stat.size > 5000, `${routeFamily} screenshot looks blank or truncated`);
      const bodyTextLength = await page.locator("body").innerText().then((text: string) => text.trim().length);
      assertCondition(bodyTextLength > 80, `${routeFamily} rendered body text is unexpectedly small`);
      const reducedMotion = await page
        .getByTestId("EmbeddedReducedMotionAdapter")
        .getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "reduce", `${routeFamily} reduced-motion adapter did not activate`);
    }
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

