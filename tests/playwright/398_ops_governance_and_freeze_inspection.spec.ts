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
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/cases/jp_manage_local_appointment?case=SUP-398-002&tab=freeze&event=evt-398-freeze&dock=true`,
      { waitUntil: "networkidle" },
    );
    const root = page.getByTestId("NHSAppChannelControlWorkbench");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-route-family")) === "appointment_manage",
      "release route did not select appointment case.",
    );
    assertCondition(
      (await page.getByTestId("NHSAppRouteFreezeInspector").getAttribute("data-freeze-posture")) ===
        "redirect_to_safe_route",
      "freeze inspector missing redirect_to_safe_route posture.",
    );
    assertCondition(
      (await page
        .getByTestId("NHSAppArtifactPostureCard")
        .getAttribute("data-artifact-posture")) === "download_blocked",
      "artifact posture did not stay subordinate to freeze.",
    );
    assertCondition(
      (await page
        .getByTestId("NHSAppSupportRecoveryActionBar")
        .getAttribute("data-recovery-kind")) === "browser_safe_route",
      "recovery action bar did not expose browser safe route.",
    );
    assertCondition(
      page.url().includes("tab=freeze") &&
        page.url().includes("event=evt-398-freeze") &&
        page.url().includes("freeze=redirect_to_safe_route"),
      `governance inspector state not serialized: ${page.url()}`,
    );
    await page.getByTestId("ChannelInspectorDockToggle").click();
    assertCondition(page.url().includes("dock=false"), `dock state not serialized: ${page.url()}`);
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
