import fs from "node:fs";

import {
  assertCondition,
  embeddedConvergenceRouteFamilies,
  importPlaywright,
  openEmbeddedDesignRoute,
  outputPath,
  runEmbeddedDesignConvergenceAssertions,
  startPatientWeb,
  stopPatientWeb,
} from "./395_embedded_design_convergence.helpers.ts";

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
    for (const routeFamily of embeddedConvergenceRouteFamilies) {
      await openEmbeddedDesignRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedDesignConvergenceAssertions(page, `${routeFamily} visual`);
      const screenshot = outputPath(`395-${routeFamily}-embedded-design-convergence.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      assertCondition(fs.statSync(screenshot).size > 5000, `${routeFamily} screenshot looks blank`);
      const bundleRect = await page.getByTestId("EmbeddedDesignBundleProvider").evaluate((node: HTMLElement) => {
        const rect = node.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
      assertCondition(bundleRect.width <= 392, `${routeFamily} bundle exceeded narrow viewport width`);
      assertCondition(bundleRect.height > 200, `${routeFamily} bundle height is unexpectedly short`);
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

