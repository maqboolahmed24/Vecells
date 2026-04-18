import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const clinicianMessageCoverage = [
  "message row selection updates the detail plane without leaving the message route",
  "provider acceptance does not imply durable delivery",
  "contradictory same-fence receipts freeze the thread into stale-recoverable repair posture",
  "attachment recovery appears inline when it is the current legal repair path",
];

async function selectMessageRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${taskId}'] .staff-shell__message-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=live`, "WorkspaceMessagesRoute");
    const messageRoute = page.locator("[data-testid='ClinicianMessageThreadSurface']");
    await messageRoute.waitFor();
    assertCondition(
      (await messageRoute.getAttribute("data-design-mode")) == "Thread_Repair_Studio",
      "message route should publish the thread repair studio mode",
    );

    await selectMessageRow(page, "task-208");
    assertCondition(
      new URL(page.url()).pathname === "/workspace/messages",
      "message row selection should stay inside the same shell route",
    );
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-delivery-truth")) ===
        "transport_accepted",
      "task-208 should remain transport-accepted rather than durable delivery",
    );
    assertCondition(
      (await page.locator("[data-testid='DeliveryTruthLadder']").getAttribute("data-current-truth")) ===
        "transport_accepted",
      "truth ladder should stay at transport accepted for provider-accepted-only delivery",
    );
    assertCondition(
      (await page.locator("[data-step-key='evidence_delivered'][data-state='current']").count()) === 0,
      "provider acceptance must not render evidence-delivered as the current step",
    );

    await selectMessageRow(page, "task-412");
    await page.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Delivery dispute review" }).click();
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-mutation-state")) ===
        "stale_recoverable",
      "contradictory message thread should freeze into stale-recoverable posture",
    );
    assertCondition(
      (await page.locator("[data-testid='DeliveryDisputeStage']").getAttribute("data-stage-state")) ===
        "review_frozen",
      "contradictory same-fence evidence should freeze the dispute stage",
    );
    await page.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Repair workbench" }).click();
    await page.waitForFunction(
      () => document.querySelector("[data-testid='ClinicianMessageDetailSurface']")?.getAttribute("data-dispute-stage") === "repair",
    );
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-dispute-stage")) ===
        "repair",
      "repair stage should open in-shell without leaving the message route",
    );
    assertCondition(
      (await page.locator("[data-action-key='route_repair']").getAttribute("data-enabled")) === "true",
      "route repair should stay visible and enabled when contradiction dominates",
    );
    assertCondition(
      (await page.locator("[data-action-key='resend']").getAttribute("data-enabled")) === "false",
      "resend should remain blocked under contradictory same-fence delivery truth",
    );

    await selectMessageRow(page, "task-118");
    assertCondition(
      (await page.locator("[data-testid='AttachmentRecoveryPrompt']").count()) === 1,
      "attachment recovery prompt should be visible when attachment loss is the active repair mode",
    );
    assertCondition(
      (await page.locator("[data-action-key='attachment_recovery']").getAttribute("data-enabled")) === "true",
      "attachment recovery should be the enabled repair path for task-118",
    );
    assertCondition(
      (await page.locator("[data-action-key='reissue']").getAttribute("data-enabled")) === "false",
      "reissue should stay blocked until the attachment recovery checkpoint is satisfied",
    );

    await assertNoHorizontalOverflow(page, "264 clinician message repair desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
