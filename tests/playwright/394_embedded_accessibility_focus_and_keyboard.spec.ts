import {
  assertCondition,
  assertFocusedElementNotObscured,
  embeddedA11yRouteFamilies,
  importPlaywright,
  openEmbeddedA11yRoute,
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
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    for (const routeFamily of embeddedA11yRouteFamilies) {
      await openEmbeddedA11yRoute(page, server.baseUrl, routeFamily);
      await runEmbeddedA11yEquivalentAssertions(page, `${routeFamily} focus baseline`);

      await page.getByTestId("EmbeddedFocusGuard").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Tab");
      await page.waitForFunction(() => {
        const layer = document.querySelector("[data-testid='EmbeddedAccessibilityResponsiveLayer']");
        return layer?.getAttribute("data-input-modality") === "keyboard";
      });

      const focusedSelector = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        return active?.getAttribute("data-testid") ?? active?.tagName ?? "none";
      });
      assertCondition(focusedSelector !== "BODY", `${routeFamily} keyboard tab did not enter embedded content`);
      await assertFocusedElementNotObscured(page, `${routeFamily} keyboard tab`);

      await page.keyboard.press("Escape");
      await page.waitForFunction(() =>
        (document.querySelector("[data-testid='AssistiveAnnouncementDedupeBus']")?.textContent ?? "").includes(
          "Transient embedded overlay dismissed",
        ),
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

