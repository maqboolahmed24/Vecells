import {
  assertCondition,
  embeddedA11yRouteFamilies,
  importPlaywright,
  openEmbeddedA11yRoute,
  runEmbeddedA11yEquivalentAssertions,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./394_embedded_accessibility.helpers.ts";
import { resolveEmbeddedA11yCoverageProfile } from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 820 },
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    for (const routeFamily of embeddedA11yRouteFamilies) {
      const profile = resolveEmbeddedA11yCoverageProfile(routeFamily);
      await openEmbeddedA11yRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedA11yEquivalentAssertions(page, `${routeFamily} semantics`);

      const boundarySnapshot = await writeAriaSnapshot(
        page.getByTestId("EmbeddedRouteSemanticBoundary"),
        `394-${routeFamily}-semantic-boundary.aria.yml`,
      );
      assertCondition(
        boundarySnapshot.includes(profile.label) || boundarySnapshot.length > 80,
        `${routeFamily} semantic boundary snapshot too small`,
      );

      const routeSnapshot = await writeAriaSnapshot(
        page.getByTestId(profile.rootTestId),
        `394-${routeFamily}-route-root.aria.yml`,
      );
      assertCondition(routeSnapshot.length > 80, `${routeFamily} route root ARIA snapshot too small`);

      const reporter = page.getByTestId("EmbeddedA11yCoverageReporter");
      assertCondition(
        (await reporter.getAttribute("data-root-testid")) === profile.rootTestId,
        `${routeFamily} reporter root mismatch`,
      );
      assertCondition(
        (await reporter.getAttribute("data-action-testid")) === profile.actionTestId,
        `${routeFamily} reporter action mismatch`,
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

