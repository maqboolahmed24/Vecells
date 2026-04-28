import {
  assertCondition,
  embeddedConvergenceRouteFamilies,
  importPlaywright,
  openEmbeddedDesignRoute,
  runEmbeddedDesignConvergenceAssertions,
  startPatientWeb,
  stopPatientWeb,
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
      await runEmbeddedDesignConvergenceAssertions(page, `${routeFamily} state copy`);
      const ctaVerb = await page.getByTestId("EmbeddedStateCopyRegistry").getAttribute("data-primary-cta-verb");
      assertCondition(Boolean(ctaVerb), `${routeFamily} missing primary CTA verb`);
      assertCondition(
        ["Continue", "Save and continue", "Review", "Choose", "Open", "Resume"].includes(ctaVerb ?? ""),
        `${routeFamily} CTA verb drifted: ${ctaVerb}`,
      );
      const normalizerText = await page.getByTestId("EmbeddedMicrocopyNormalizer").innerText();
      assertCondition(
        normalizerText.includes(profile.primaryStateLabel),
        `${routeFamily} normalizer missing state label`,
      );
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

