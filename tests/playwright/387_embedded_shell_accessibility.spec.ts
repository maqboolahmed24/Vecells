import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedShellUrl,
  importPlaywright,
  openShellRoute,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./387_embedded_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    await openShellRoute(
      page,
      `${server.baseUrl}/requests/REQ-2049/status?phase7=embedded_shell&from=nhsApp`,
    );
    const root = page.getByTestId("EmbeddedPatientShellRoot");
    assertCondition((await root.getAttribute("data-shell-mode")) === "embedded", "query hint did not render embedded");
    assertCondition((await root.getAttribute("data-shell-state")) === "revalidate_only", "query hint not revalidate only");

    const ribbonSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedShellStateRibbon"),
      "387-embedded-shell-state-ribbon.aria.yml",
    );
    assertCondition(ribbonSnapshot.includes("Shell state"), "state ribbon ARIA snapshot missing heading");
    assertCondition(ribbonSnapshot.includes("Revalidate"), "state ribbon ARIA snapshot missing state");

    const recoverySnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedRecoveryFrame"),
      "387-embedded-recovery-frame.aria.yml",
    );
    assertCondition(
      recoverySnapshot.includes("NHS App context needs revalidation"),
      "recovery frame ARIA snapshot missing revalidation copy",
    );

    assertCondition((await page.getByTestId("standalone-shell-header").count()) === 0, "standalone header leaked");
    assertCondition((await page.getByTestId("standalone-shell-footer").count()) === 0, "standalone footer leaked");
    assertCondition((await page.getByTestId("patient-shell-masthead").count()) === 0, "patient masthead leaked");
    assertCondition((await page.getByTestId("patient-shell-footer").count()) === 0, "patient footer leaked");
    const routeTitleCount = await page.locator("#embedded-route-title, #embedded-route-content-title").count();
    assertCondition(routeTitleCount >= 2, "embedded mode lost route title semantics");

    const regionCount = await page
      .locator("main, nav, aside[aria-label], [role='banner'], section[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(regionCount >= 7, `expected labelled shell regions, found ${regionCount}`);
    await assertNoHorizontalOverflow(page, "query-hint accessibility shell");

    await openShellRoute(page, embeddedShellUrl(server.baseUrl));
    await page.keyboard.press("Tab");
    const focusedLabel = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.getAttribute("aria-label") ?? element?.textContent ?? "";
    });
    assertCondition(focusedLabel.trim().length > 0, "keyboard focus did not reach shell controls");
    await page.getByTestId("EmbeddedDominantActionButton").focus();
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
        "EmbeddedDominantActionButton",
      "dominant action did not accept focus",
    );
    await assertNoHorizontalOverflow(page, "live accessibility shell");
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
