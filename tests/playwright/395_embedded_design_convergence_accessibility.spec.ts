import {
  assertCondition,
  embeddedConvergenceRouteFamilies,
  importPlaywright,
  openEmbeddedDesignRoute,
  runEmbeddedDesignConvergenceAssertions,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./395_embedded_design_convergence.helpers.ts";
import { resolveEmbeddedDesignRouteProfile } from "../../apps/patient-web/src/embedded-design-convergence.model.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB" });
  const page = await context.newPage();

  try {
    for (const routeFamily of embeddedConvergenceRouteFamilies) {
      const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
      await openEmbeddedDesignRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedDesignConvergenceAssertions(page, `${routeFamily} accessibility`);

      const providerSnapshot = await writeAriaSnapshot(
        page.getByTestId("EmbeddedDesignBundleProvider"),
        `395-${routeFamily}-design-provider.aria.yml`,
      );
      assertCondition(providerSnapshot.includes(profile.label), `${routeFamily} provider snapshot missing label`);
      assertCondition(providerSnapshot.includes("table"), `${routeFamily} provider snapshot missing fallback table`);

      const routeSnapshot = await writeAriaSnapshot(
        page.getByTestId(profile.rootTestId),
        `395-${routeFamily}-route-root.aria.yml`,
      );
      assertCondition(routeSnapshot.length > 80, `${routeFamily} route ARIA snapshot too small`);
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

