import {
  assertCondition,
  importPlaywright,
  networkConfirmationUrl,
  openHubRoute,
  openNetworkConfirmationRoute,
  outputPath,
  startHubDesk,
  startPatientWeb,
  stopHubDesk,
  stopPatientWeb,
  trackExternalRequests,
  waitForHubCommitPosture,
  waitForHubRootState,
  waitForPatientConfirmationState,
  writeJsonArtifact,
} from "./329_commit_confirmation.helpers";
import {
  networkManageUrl,
  openNetworkManageRoute,
  waitForNetworkManageState,
} from "./330_network_manage.helpers.ts";

async function activeTestId(page: any): Promise<string | null> {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute("data-testid") ?? null,
  );
}

async function clickAction(page: any, actionId: string): Promise<void> {
  await page.getByTestId("ArtifactHandoffActionBar").locator(`[data-action-id='${actionId}']`).click();
}

export const crossOrgHandoffAndReturnAnchorCoverage = [
  "enabled artifact actions keep the current summary or receipt anchor as the lawful return target",
  "patient and hub surfaces expose explicit return receipts instead of silent shell jumps",
  "summary-only postures keep action gating explicit without dropping the current anchor state",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: hubChild, baseUrl: hubBaseUrl },
  ] = await Promise.all([startPatientWeb(), startHubDesk()]);
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  const patientContext = await browser.newContext({
    viewport: { width: 1280, height: 960 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  const hubContext = await browser.newContext({
    viewport: { width: 1520, height: 1120 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });

  await Promise.all([
    patientContext.tracing.start({ screenshots: true, snapshots: true }),
    hubContext.tracing.start({ screenshots: true, snapshots: true }),
  ]);

  try {
    const patientPage = await patientContext.newPage();
    trackExternalRequests(patientPage, patientBaseUrl, externalRequests);
    let confirmationStage: string | null = null;
    let manageStage: string | null = null;

    await openNetworkConfirmationRoute(
      patientPage,
      networkConfirmationUrl(patientBaseUrl, {
        scenarioId: "network_confirmation_329_practice_acknowledged",
      }),
    );
    await waitForPatientConfirmationState(patientPage, {
      scenarioId: "network_confirmation_329_practice_acknowledged",
      truthState: "calm_confirmed",
    });
    await clickAction(patientPage, "preview");
    let confirmationRoot = patientPage.getByTestId("PatientNetworkConfirmationView");
    assertCondition(
      (await confirmationRoot.getAttribute("data-artifact-stage-mode")) === "preview",
      "confirmation preview should move the artifact stage into preview",
    );
    await patientPage.getByTestId("ReturnAnchorReceipt").getByRole("button").click();
    assertCondition(
      (await activeTestId(patientPage)) === "patient-confirmation-summary",
      "confirmation return receipt should restore focus to the appointment summary",
    );

    await clickAction(patientPage, "external_handoff");
    assertCondition(
      (await confirmationRoot.getAttribute("data-return-anchor-state")) === "safe",
      "confirmation handoff should keep a safe return-anchor state",
    );
    confirmationStage = await confirmationRoot.getAttribute("data-artifact-stage-mode");
    await patientPage.getByTestId("ReturnAnchorReceipt").getByRole("button").click();
    assertCondition(
      (await activeTestId(patientPage)) === "patient-confirmation-summary",
      "confirmation handoff return should preserve the appointment summary anchor",
    );

    await openNetworkConfirmationRoute(
      patientPage,
      networkConfirmationUrl(patientBaseUrl, {
        scenarioId: "network_confirmation_329_pending",
      }),
    );
    await waitForPatientConfirmationState(patientPage, {
      scenarioId: "network_confirmation_329_pending",
      truthState: "pending_copy",
    });
    assertCondition(
      await patientPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='preview']")
        .isDisabled(),
      "pending confirmation should expose explicit preview gating",
    );
    assertCondition(
      (await patientPage.getByTestId("PatientNetworkConfirmationView").getAttribute(
        "data-return-anchor-state",
      )) === "safe",
      "pending confirmation should keep the current return-anchor state safe",
    );

    await openNetworkManageRoute(
      patientPage,
      networkManageUrl(patientBaseUrl, { scenarioId: "network_manage_330_live" }),
    );
    await waitForNetworkManageState(patientPage, {
      scenarioId: "network_manage_330_live",
      capabilityState: "live",
    });
    await clickAction(patientPage, "export");
    let manageRoot = patientPage.getByTestId("Patient_Network_Manage_Route");
    assertCondition(
      (await manageRoot.getAttribute("data-artifact-stage-mode")) === "export",
      "manage export should move the artifact stage into export",
    );
    manageStage = await manageRoot.getAttribute("data-artifact-stage-mode");
    await patientPage.getByTestId("ReturnAnchorReceipt").getByRole("button").click();
    assertCondition(
      (await activeTestId(patientPage)) === "network-manage-summary-card",
      "manage return receipt should restore focus to the manage summary",
    );

    const hubPage = await hubContext.newPage();
    trackExternalRequests(hubPage, hubBaseUrl, externalRequests);

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-066`, "hub-case-route");
    await waitForHubRootState(hubPage, {
      currentPath: "/hub/case/hub-case-066",
      selectedCaseId: "hub-case-066",
      viewMode: "case",
    });
    await waitForHubCommitPosture(hubPage, "booked_pending_practice_ack");
    await clickAction(hubPage, "export");
    const hubPane = hubPage.getByTestId("HubCommitConfirmationPane");
    assertCondition(
      (await hubPane.getAttribute("data-artifact-stage-mode")) === "export",
      "hub export should move the audit artifact stage into export",
    );
    await hubPage.getByTestId("ReturnAnchorReceipt").getByRole("button").click();
    assertCondition(
      (await activeTestId(hubPage)) === "HubCommitSettlementReceipt",
      "hub return receipt should restore focus to the settlement receipt",
    );

    const hubStage = await hubPane.getAttribute("data-artifact-stage-mode");

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/audit/hub-case-066`, "HubCommitConfirmationPane");
    await waitForHubRootState(hubPage, {
      currentPath: "/hub/audit/hub-case-066",
      selectedCaseId: "hub-case-066",
      viewMode: "audit",
    });
    assertCondition(
      await hubPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='preview']")
        .isDisabled(),
      "quiet audit posture should keep preview gated",
    );
    assertCondition(
      (await hubPane.getAttribute("data-artifact-grant-state")) === "summary_only",
      "quiet audit posture should remain summary-only",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    writeJsonArtifact("334-cross-org-return-anchor-results.json", {
      confirmationStage,
      manageStage,
      hubStage,
    });
    await patientPage.screenshot({
      path: outputPath("334-cross-org-return-anchor-patient.png"),
      fullPage: true,
    });
    await hubPage.screenshot({
      path: outputPath("334-cross-org-return-anchor-hub.png"),
      fullPage: true,
    });
  } finally {
    await Promise.all([
      patientContext.tracing.stop({ path: outputPath("334-cross-org-return-anchor-patient-trace.zip") }),
      hubContext.tracing.stop({ path: outputPath("334-cross-org-return-anchor-hub-trace.zip") }),
    ]).catch(() => undefined);
    await Promise.all([patientContext.close(), hubContext.close()]).catch(() => undefined);
    await browser.close();
    await Promise.all([stopPatientWeb(patientChild), stopHubDesk(hubChild)]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
