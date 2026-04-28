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
  const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/support/channels/nhs-app?case=SUP-398-001&tab=context&event=evt-398-entry&dock=true`,
      { waitUntil: "networkidle" },
    );
    const root = page.getByTestId("NHSAppChannelControlWorkbench");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "NHSApp_Channel_Control_Workbench",
      "398 visual mode missing.",
    );
    assertCondition(
      (await root.getAttribute("data-selected-channel")) === "embedded_nhs_app",
      "selected channel hook did not hydrate from URL.",
    );
    assertCondition(
      (await root.getAttribute("data-sso-outcome")) === "silent_success",
      "SSO outcome hook did not hydrate from URL.",
    );
    assertCondition(
      (
        (await page.getByTestId("NHSAppJumpOffRouteChip").getAttribute("data-jump-off-route")) ?? ""
      ).includes("/start/medical-request"),
      "jump-off route chip missing start request path.",
    );

    await page.getByTestId("ChannelCaseRow-SUP-398-002").click();
    await page.getByTestId("NHSAppRouteFreezeInspector").waitFor();
    assertCondition(
      page.url().includes("case=SUP-398-002") &&
        page.url().includes("route=appointment_manage") &&
        page.url().includes("sso=safe_reentry_required"),
      `case selection did not serialize to URL: ${page.url()}`,
    );
    assertCondition(
      (await root.getAttribute("data-freeze-posture")) === "redirect_to_safe_route",
      "freeze posture hook did not update after case selection.",
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
