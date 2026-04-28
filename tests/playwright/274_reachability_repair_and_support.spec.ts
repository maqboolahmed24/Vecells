import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffMessagesRoute,
  openSupportRoute,
  selectCallbackRow,
  selectMessageRow,
  startPatientWorkspacePair,
  stopCommunicationTrace,
  stopPatientWorkspacePair,
} from "./274_phase3_communication.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    await context.tracing.start({ screenshots: true, snapshots: true });

    const callbackPage = await context.newPage();
    const messagePage = await context.newPage();
    const patientPage = await context.newPage();
    const supportPage = await context.newPage();

    await openStaffCallbacksRoute(callbackPage, pair.workspaceBaseUrl, "live");
    await selectCallbackRow(callbackPage, "task-412");
    const callbackRepairButton = callbackPage
      .locator("[data-testid='CallbackRouteRepairPrompt'] button")
      .first();
    await callbackRepairButton.focus();
    await callbackPage.keyboard.press("Enter");
    await callbackPage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='CallbackDetailSurface']")
          ?.getAttribute("data-stage") === "repair",
    );
    const callbackAnchorBeforeReload = await callbackPage
      .locator("[data-testid='WorkspaceShellRouteFamily']")
      .getAttribute("data-selected-anchor-ref");

    await callbackPage.reload({ waitUntil: "networkidle" });
    await callbackPage.locator("[data-testid='CallbackWorklistRoute']").waitFor();
    assertCondition(
      (await callbackPage.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) ===
        "repair",
      "callback repair stage should survive reload in the same shell",
    );
    assertCondition(
      (await callbackPage
        .locator("[data-testid='WorkspaceShellRouteFamily']")
        .getAttribute("data-selected-anchor-ref")) === callbackAnchorBeforeReload,
      "callback anchor should survive reload while repair is active",
    );

    await openStaffMessagesRoute(messagePage, pair.workspaceBaseUrl, "live");
    await selectMessageRow(messagePage, "task-412");
    const repairWorkbenchButton = messagePage.getByRole("button", { name: "Repair workbench" });
    await repairWorkbenchButton.focus();
    await messagePage.keyboard.press("Enter");
    await messagePage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='ClinicianMessageDetailSurface']")
          ?.getAttribute("data-dispute-stage") === "repair",
    );
    assertCondition(
      (await messagePage.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-dispute-stage")) ===
        "repair",
      "message repair stage should open from keyboard-only input",
    );

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_repair",
      "state=repair",
    );
    const patientRepairButton = patientPage.getByRole("button", {
      name: "Confirm contact details",
    });
    await patientRepairButton.focus();
    await patientPage.keyboard.press("Enter");
    await patientPage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='PatientConversationRoute']")
          ?.getAttribute("data-contact-repair-state") === "applied",
    );
    assertCondition(
      (await patientPage.locator("[data-testid='PatientConversationRoute']").getAttribute("data-contact-repair-state")) ===
        "applied",
      "patient repair flow should remain keyboard-complete in the same conversation route",
    );
    await patientPage.reload({ waitUntil: "networkidle" });
    await patientPage.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='PatientConversationRoute']").getAttribute("data-contact-repair-state")) ===
        "applied",
      "patient repair state should survive reload while route verification is pending",
    );

    await openSupportRoute(
      supportPage,
      `${pair.workspaceBaseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&delta=review&restore=ready&context=linked`,
      "SupportReplayRoute",
    );
    const ticketTab = supportPage.getByRole("tab", { name: "Ticket" });
    await ticketTab.focus();
    await supportPage.keyboard.press("Enter");
    await supportPage.locator("[data-testid='SupportTicketRoute']").waitFor();
    const restoreButton = supportPage.getByRole("button", { name: "Open replay restore" });
    await restoreButton.focus();
    await supportPage.keyboard.press("Enter");
    await supportPage.locator("[data-testid='SupportReplayRoute']").waitFor();
    assertCondition(
      new URL(supportPage.url()).pathname ===
        "/ops/support/replay/support_replay_session_218_delivery_failure",
      "support replay restore should open the canonical replay session from keyboard-only input",
    );
    await supportPage.goBack({ waitUntil: "networkidle" });
    await supportPage.locator("[data-testid='SupportTicketRoute']").waitFor();
    assertCondition(
      (await supportPage.locator(".support-workspace").getAttribute("data-restore-state")) ===
        "ready",
      "support restore state should survive history round-trips",
    );

    await assertWorkspaceNoHorizontalOverflow(callbackPage, "274 callback repair history");
    await assertWorkspaceNoHorizontalOverflow(messagePage, "274 message repair history");
    await assertPatientNoHorizontalOverflow(patientPage, "274 patient repair history");
    await assertWorkspaceNoHorizontalOverflow(supportPage, "274 support replay history");

    await stopCommunicationTrace(context, "274-reachability-repair-support-trace.zip");
  } finally {
    await browser.close();
    await stopPatientWorkspacePair(pair);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
