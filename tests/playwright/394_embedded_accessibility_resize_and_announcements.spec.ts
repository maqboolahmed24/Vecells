import {
  assertCondition,
  importPlaywright,
  openEmbeddedA11yRoute,
  runEmbeddedA11yEquivalentAssertions,
  startPatientWeb,
  stopPatientWeb,
} from "./394_embedded_accessibility.helpers.ts";
import type { EmbeddedAccessibilityRouteFamily } from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

const RESIZE_ROUTES: readonly EmbeddedAccessibilityRouteFamily[] = [
  "booking",
  "pharmacy",
  "recovery_artifact",
  "embedded_shell",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    for (const routeFamily of RESIZE_ROUTES) {
      await openEmbeddedA11yRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedA11yEquivalentAssertions(page, `${routeFamily} resize baseline`);

      await page.setViewportSize({ width: 360, height: 700 });
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await page.waitForFunction(() => {
        const host = document.querySelector("[data-testid='HostResizeResilienceLayer']");
        return Number(host?.getAttribute("data-resize-count") ?? "0") >= 1;
      });
      await page.waitForFunction(() => {
        const layer = document.querySelector("[data-testid='EmbeddedAccessibilityResponsiveLayer']");
        return layer?.getAttribute("data-host-resize-state") === "settled";
      });
      const safeArea = await page.getByTestId("EmbeddedSafeAreaObserver").getAttribute("data-keyboard-offset");
      assertCondition(safeArea !== null, `${routeFamily} safe-area observer did not publish keyboard offset`);

      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("embedded-a11y-announce", { detail: { message: "Route settled" } }));
      });
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='AssistiveAnnouncementDedupeBus']")
            ?.getAttribute("data-announcement-count") === "2",
      );
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("embedded-a11y-announce", { detail: { message: "Route settled" } }));
      });
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='AssistiveAnnouncementDedupeBus']")
            ?.getAttribute("data-duplicate-count") === "1",
      );
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("embedded-a11y-announce", { detail: { message: "Route updated" } }));
      });
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='AssistiveAnnouncementDedupeBus']")
            ?.getAttribute("data-announcement-count") === "3",
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
