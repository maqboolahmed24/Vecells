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
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/routes/jp_pharmacy_status?env=sandpit&preview=ios_safe_area&tab=evidence`,
      { waitUntil: "networkidle" },
    );
    const root = page.getByTestId("NHSAppReadinessCockpit");
    await root.waitFor();
    assertCondition((await root.getAttribute("data-visual-mode")) === "NHSApp_Readiness_Cockpit", "visual mode missing");
    assertCondition(
      ((await root.getAttribute("data-current-environment-tuple")) ?? "").includes("sandpit"),
      "environment tuple not restored from URL",
    );

    await page.getByTestId("RouteRow-jp_waitlist_offer_response").click();
    await page.getByTestId("NHSAppRouteInspector").waitFor();
    assertCondition(
      page.url().includes("/ops/release/nhs-app/routes/jp_waitlist_offer_response"),
      `route selection did not serialize to URL: ${page.url()}`,
    );
    assertCondition(
      (await page.getByTestId("NHSAppRouteInspector").getAttribute("data-selected-route")) ===
        "jp_waitlist_offer_response",
      "inspector did not follow selected row",
    );
    assertCondition(
      (await root.getAttribute("data-current-readiness-verdict")) === "blocked",
      "readiness verdict hook did not update",
    );

    await page.locator("#nhs-app-readiness-filter").selectOption("blocked");
    assertCondition(
      await page.getByTestId("RouteRow-jp_waitlist_offer_response").isVisible(),
      "blocked readiness filter should retain waitlist route",
    );
    await page.getByTestId("InspectorOpenEvidenceButton").click();
    assertCondition(
      (await page.getByTestId("NHSAppEvidenceDrawer").getAttribute("data-drawer-state")) === "open",
      "evidence drawer did not open",
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
