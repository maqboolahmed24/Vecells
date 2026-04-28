import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  startOpsConsole,
  stopOpsConsole,
} from "./386_nhs_app_readiness.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/preview?route=jp_records_letters_summary&env=sandpit&preview=ios_safe_area&tab=compatibility`,
      { waitUntil: "networkidle" },
    );
    const preview = page.getByTestId("NHSAppEmbeddedPreviewPanel");
    await preview.waitFor();
    assertCondition((await preview.getAttribute("data-hidden-supplier-chrome")) === "true", "supplier chrome not hidden");
    assertCondition((await preview.getAttribute("data-freeze-mode")) === "hidden", "records freeze mode not rendered");
    assertCondition(
      (await page.getByTestId("NHSAppPreviewCapabilityPanel").getAttribute("data-bridge-available")) === "true",
      "records bridge availability should be visible",
    );

    await page.getByTestId("PreviewModeSelect").selectOption("reduced_motion");
    assertCondition(page.url().includes("/ops/release/nhs-app/preview"), "preview path was not preserved");
    assertCondition(
      (await preview.getAttribute("data-current-preview-mode")) === "reduced_motion",
      "preview mode hook did not update",
    );

    await page.getByTestId("RouteRow-jp_waitlist_offer_response").click();
    assertCondition(
      (await preview.getAttribute("data-freeze-mode")) === "redirect_to_safe_route",
      "waitlist safe-route freeze mode did not update preview",
    );
    assertCondition(
      await page.getByText("Safe route: /appointments/waitlist/offers").isVisible(),
      "safe-route redirect copy missing from preview",
    );
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.close();
    await browser.close();
    await stopOpsConsole(server.process);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
