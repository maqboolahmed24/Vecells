import {
  assertVisualizationFallbackParity,
  embeddedConvergenceRouteFamilies,
  importPlaywright,
  openEmbeddedDesignRoute,
  runEmbeddedDesignConvergenceAssertions,
  startPatientWeb,
  stopPatientWeb,
} from "./395_embedded_design_convergence.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 820 }, locale: "en-GB" });
  const page = await context.newPage();

  try {
    for (const routeFamily of embeddedConvergenceRouteFamilies) {
      await openEmbeddedDesignRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedDesignConvergenceAssertions(page, `${routeFamily} fallback baseline`);
      await assertVisualizationFallbackParity(page, `${routeFamily} fallback parity`);
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

