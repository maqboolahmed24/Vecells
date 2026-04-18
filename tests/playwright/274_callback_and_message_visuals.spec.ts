import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openCommunicationIntegrityScenario,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffMessagesRoute,
  outputPath,
  readAttributes,
  selectCallbackRow,
  selectMessageRow,
  startCommunicationIntegrityLabServer,
  startPatientWorkspacePair,
  stopCommunicationIntegrityLabServer,
  stopCommunicationTrace,
  stopPatientWorkspacePair,
  writeCommunicationAriaSnapshots,
} from "./274_phase3_communication.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const lab = await startCommunicationIntegrityLabServer();
  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1500, height: 1080 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const desktop = await desktopContext.newPage();

    const screenshotBuffers = {};
    for (const [scenarioId, fileName] of [
      ["callback_pending", "274-callback-pending.png"],
      ["callback_no_answer", "274-callback-no-answer.png"],
      ["callback_invalid_route", "274-callback-invalid-route.png"],
      ["message_delivered", "274-message-delivered.png"],
      ["message_disputed", "274-message-disputed.png"],
      ["repair_required", "274-repair-required.png"],
      ["stale_recoverable", "274-stale-recoverable.png"],
    ]) {
      await openCommunicationIntegrityScenario(desktop, lab.atlasUrl, scenarioId);
      const root = desktop.locator("[data-testid='CommunicationRepairIntegrityLab']");
      assertCondition(
        (await root.getAttribute("data-selected-scenario-id")) === scenarioId,
        `communication integrity lab failed to select ${scenarioId}`,
      );
      const buffer = await desktop.screenshot({ path: outputPath(fileName), fullPage: true });
      screenshotBuffers[scenarioId] = buffer;
    }

    assertCondition(
      !screenshotBuffers["callback_pending"].equals(screenshotBuffers["callback_invalid_route"]),
      "callback pending and invalid-route visuals collapsed to the same baseline",
    );
    assertCondition(
      !screenshotBuffers["message_delivered"].equals(screenshotBuffers["message_disputed"]),
      "message delivered and disputed visuals collapsed to the same baseline",
    );
    assertCondition(
      !screenshotBuffers["repair_required"].equals(screenshotBuffers["stale_recoverable"]),
      "repair-required and stale-recoverable visuals collapsed to the same baseline",
    );

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openCommunicationIntegrityScenario(mobile, lab.atlasUrl, "repair_required");
    await mobile.screenshot({
      path: outputPath("274-communication-mobile-reduced.png"),
      fullPage: true,
    });

    const liveContext = await browser.newContext({ viewport: { width: 1440, height: 980 } });
    const patientPage = await liveContext.newPage();
    const callbackPage = await liveContext.newPage();
    const messagePage = await liveContext.newPage();

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_repair",
      "state=repair",
    );
    await openStaffCallbacksRoute(callbackPage, pair.workspaceBaseUrl, "live");
    await selectCallbackRow(callbackPage, "task-412");
    await openStaffMessagesRoute(messagePage, pair.workspaceBaseUrl, "live");
    await selectMessageRow(messagePage, "task-412");

    const ariaSnapshots = {
      patientRepair: {
        route: await readAttributes(patientPage.locator("[data-testid='PatientConversationRoute']"), [
          "data-contact-repair-state",
          "data-delivery-posture",
          "data-repair-posture",
          "data-dominant-patient-action",
        ]),
        repairPrompt: await readAttributes(
          patientPage.locator("[data-testid='PatientContactRepairPrompt']"),
          ["data-anchor-ref"],
        ),
      },
      callbackCard: {
        route: await readAttributes(callbackPage.locator("[data-testid='CallbackWorklistRoute']"), [
          "data-callback-state",
          "data-route-health",
          "data-resolution-gate",
        ]),
        detail: await readAttributes(callbackPage.locator("[data-testid='CallbackDetailSurface']"), [
          "data-phase3-bundle-ref",
          "data-dedupe-state",
          "data-stage",
        ]),
      },
      messageMasthead: {
        surface: await readAttributes(
          messagePage.locator("[data-testid='ClinicianMessageThreadSurface']"),
          ["data-thread-state", "data-delivery-truth", "data-repair-kind", "data-dispute-stage"],
        ),
        masthead: await readAttributes(
          messagePage.locator("[data-testid='MessageThreadMasthead']"),
          ["data-thread-state", "data-resolution-gate"],
        ),
      },
    };
    await writeCommunicationAriaSnapshots(
      ariaSnapshots,
      "274-communication-aria-snapshots.json",
    );

    await assertPatientNoHorizontalOverflow(patientPage, "274 patient repair visuals");
    await assertWorkspaceNoHorizontalOverflow(callbackPage, "274 callback visuals");
    await assertWorkspaceNoHorizontalOverflow(messagePage, "274 message visuals");

    await stopCommunicationTrace(desktopContext, "274-communication-visual-trace.zip");
    await stopCommunicationTrace(mobileContext, "274-communication-mobile-trace.zip");
  } finally {
    await browser.close();
    await stopCommunicationIntegrityLabServer(lab.server);
    await stopPatientWorkspacePair(pair);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
