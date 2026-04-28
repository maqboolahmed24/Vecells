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

async function readArtifactMarkers(locator: any) {
  return {
    stageMode: await locator.getAttribute("data-artifact-stage-mode"),
    grantState: await locator.getAttribute("data-artifact-grant-state"),
    returnAnchorState: await locator.getAttribute("data-return-anchor-state"),
    visualMode: await locator.getAttribute("data-artifact-visual-mode"),
  };
}

export const crossOrgArtifactModesCoverage = [
  "patient confirmation stays summary-first until current grant and host posture both permit richer movement",
  "patient manage keeps summary-only and blocked placeholder treatment explicit instead of hiding detail",
  "hub commit and recovery surfaces expose the same governed artifact grammar and continuity preview parity",
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

    const pendingRoot = patientPage.getByTestId("PatientNetworkConfirmationView");
    const pendingMarkers = await readArtifactMarkers(pendingRoot);
    let markers = pendingMarkers;
    assertCondition(
      markers.grantState === "summary_only" && markers.stageMode === "summary_first",
      `pending confirmation artifact posture drifted: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      (await patientPage.getByTestId("GovernedPlaceholderSummary").count()) === 1,
      "pending confirmation should show a governed placeholder",
    );
    assertCondition(
      await patientPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='preview']")
        .isDisabled(),
      "pending confirmation preview should stay disabled",
    );

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
    markers = await readArtifactMarkers(patientPage.getByTestId("PatientNetworkConfirmationView"));
    assertCondition(
      markers.grantState === "active" && markers.visualMode === "Governed_Artifact_Handoff_Studio",
      `acknowledged confirmation should arm active artifact mode: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      (await patientPage.getByTestId("GovernedPlaceholderSummary").count()) === 0,
      "acknowledged confirmation should not keep the placeholder visible",
    );
    assertCondition(
      !(await patientPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='external_handoff']")
        .isDisabled()),
      "acknowledged confirmation should allow external handoff in the browser host",
    );

    await openNetworkConfirmationRoute(
      patientPage,
      networkConfirmationUrl(patientBaseUrl, {
        scenarioId: "network_confirmation_329_practice_acknowledged",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    await waitForPatientConfirmationState(patientPage, {
      scenarioId: "network_confirmation_329_practice_acknowledged",
      truthState: "calm_confirmed",
      embeddedMode: "nhs_app",
    });
    markers = await readArtifactMarkers(patientPage.getByTestId("PatientNetworkConfirmationView"));
    assertCondition(
      markers.grantState === "summary_only",
      `embedded confirmation should remain summary-only: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      await patientPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='preview']")
        .isDisabled(),
      "embedded confirmation preview should stay disabled",
    );

    await openNetworkManageRoute(
      patientPage,
      networkManageUrl(patientBaseUrl, { scenarioId: "network_manage_330_live" }),
    );
    await waitForNetworkManageState(patientPage, {
      scenarioId: "network_manage_330_live",
      capabilityState: "live",
      readOnlyMode: "interactive",
    });
    const manageRoot = patientPage.getByTestId("Patient_Network_Manage_Route");
    markers = await readArtifactMarkers(manageRoot);
    assertCondition(
      markers.grantState === "active" && markers.stageMode === "summary_first",
      `live manage artifact posture drifted: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      !(await patientPage
        .getByTestId("ArtifactHandoffActionBar")
        .locator("[data-action-id='export']")
        .isDisabled()),
      "live manage should allow export",
    );

    await openNetworkManageRoute(
      patientPage,
      networkManageUrl(patientBaseUrl, { scenarioId: "network_manage_330_contact_repair" }),
    );
    await waitForNetworkManageState(patientPage, {
      scenarioId: "network_manage_330_contact_repair",
      repairState: "required",
      capabilityState: "blocked",
    });
    markers = await readArtifactMarkers(patientPage.getByTestId("Patient_Network_Manage_Route"));
    assertCondition(
      markers.grantState === "blocked",
      `contact repair should keep blocked artifact posture: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      (await patientPage.getByTestId("GovernedPlaceholderSummary").count()) === 1,
      "contact repair should explain blocked richer movement",
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
    markers = await readArtifactMarkers(hubPage.getByTestId("HubCommitConfirmationPane"));
    assertCondition(
      markers.grantState === "active" && markers.stageMode === "summary_first",
      `hub booked-pending-ack artifact posture drifted: ${JSON.stringify(markers)}`,
    );
    await hubPage.getByRole("button", { name: "Show evidence" }).click();
    await hubPage.getByTestId("PracticeNotificationArtifactSummary").waitFor();

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-041`, "hub-case-route");
    await waitForHubRootState(hubPage, {
      currentPath: "/hub/case/hub-case-041",
      selectedCaseId: "hub-case-041",
      viewMode: "case",
    });
    await waitForHubCommitPosture(hubPage, "supplier_drift");
    const hubSupplierDriftMarkers = await readArtifactMarkers(
      hubPage.getByTestId("HubCommitConfirmationPane"),
    );
    markers = hubSupplierDriftMarkers;
    assertCondition(
      markers.grantState === "blocked",
      `supplier drift should keep blocked artifact posture: ${JSON.stringify(markers)}`,
    );
    assertCondition(
      (await hubPage.getByTestId("GovernedPlaceholderSummary").count()) >= 1,
      "supplier drift should render a governed placeholder",
    );

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-052`, "hub-case-route");
    await waitForHubRootState(hubPage, {
      currentPath: "/hub/case/hub-case-052",
      selectedCaseId: "hub-case-052",
      viewMode: "case",
    });
    await hubPage.getByTestId("HubRecoveryCaseCanvas").waitFor();
    assertCondition(
      (await hubPage.getByTestId("HubRecoveryCaseCanvas").getAttribute("data-fallback-type")) ===
        "callback_request",
      "recovery canvas fallback type drifted",
    );
    assertCondition(
      (await hubPage.getByTestId("CrossOrgContentLegend").count()) >= 1,
      "recovery canvas should include the cross-org content legend",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    writeJsonArtifact("334-cross-org-artifact-modes.json", {
      patientPending: pendingMarkers,
      patientManageRepair: await readArtifactMarkers(
        patientPage.getByTestId("Patient_Network_Manage_Route"),
      ),
      hubSupplierDrift: hubSupplierDriftMarkers,
    });
    await patientPage.screenshot({
      path: outputPath("334-cross-org-artifact-modes-patient.png"),
      fullPage: true,
    });
    await hubPage.screenshot({
      path: outputPath("334-cross-org-artifact-modes-hub.png"),
      fullPage: true,
    });
  } finally {
    await Promise.all([
      patientContext.tracing.stop({ path: outputPath("334-cross-org-artifact-modes-patient-trace.zip") }),
      hubContext.tracing.stop({ path: outputPath("334-cross-org-artifact-modes-hub-trace.zip") }),
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
