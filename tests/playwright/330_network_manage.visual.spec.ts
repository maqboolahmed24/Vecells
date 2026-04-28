import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  networkManageUrl,
  openNetworkManageRoute,
  outputPath,
  startNetworkManageAtlasServer,
  startPatientWeb,
  stopPatientWeb,
} from "./330_network_manage.helpers.ts";

export const networkManageVisualCoverage = [
  "desktop live network manage screenshot",
  "desktop repair-state screenshot",
  "embedded mobile screenshot",
  "static atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const atlas = await startNetworkManageAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
    await openNetworkManageRoute(
      desktop,
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_live" }),
    );
    await desktop.screenshot({
      path: outputPath("330-network-manage-desktop-live.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(desktop, "330 desktop live route");

    const repair = await browser.newPage({ viewport: { width: 1366, height: 1100 } });
    await openNetworkManageRoute(
      repair,
      networkManageUrl(baseUrl, { scenarioId: "network_manage_330_contact_repair" }),
    );
    await repair.screenshot({
      path: outputPath("330-network-manage-desktop-repair.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(repair, "330 desktop repair route");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openNetworkManageRoute(
      mobile,
      networkManageUrl(baseUrl, {
        scenarioId: "network_manage_330_live",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    await mobile.getByTestId("network-manage-sticky-tray").waitFor();
    await mobile.screenshot({
      path: outputPath("330-network-manage-mobile-embedded.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(mobile, "330 mobile embedded route");

    const atlasPage = await browser.newPage({ viewport: { width: 1540, height: 1200 } });
    await atlasPage.goto(atlas.atlasUrl, { waitUntil: "networkidle" });
    const atlasRoot = atlasPage.locator("[data-testid='NetworkManageMessageTimelineAtlas']");
    await atlasRoot.waitFor();
    assertCondition(
      (await atlasRoot.getAttribute("data-visual-mode")) ===
        "Network_Appointment_Timeline_Workspace",
      "atlas visual mode drifted",
    );
    await atlasPage.screenshot({
      path: outputPath("330-network-manage-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    await browser.close();
    await closeServer(atlas.server);
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
