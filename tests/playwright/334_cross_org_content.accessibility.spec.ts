import {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
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
  writeJsonArtifact,
} from "./329_commit_confirmation.helpers";
import {
  networkManageUrl,
  openNetworkManageRoute,
  waitForNetworkManageState,
  writeAccessibilitySnapshot,
} from "./330_network_manage.helpers.ts";

export const crossOrgContentAccessibilityCoverage = [
  "artifact frames keep stable names, live-region restraint, and reduced-motion parity",
  "summary-first confirmation and manage surfaces reflow cleanly at the mobile-width proxy",
  "hub commit and recovery surfaces keep timeline annotations, placeholders, and legends readable without horizontal clipping",
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
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  const hubContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
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
        scenarioId: "network_confirmation_329_practice_informed",
      }),
    );
    await assertNoHorizontalOverflow(patientPage, "334 patient confirmation mobile");
    const confirmationFrame = patientPage.getByTestId("patient-confirmation-artifact-frame");
    const confirmationAria = await captureAria(confirmationFrame, patientPage);
    const confirmationLiveRegion = patientPage.getByTestId("patient-network-confirmation-live-region");
    assertCondition(
      (await confirmationLiveRegion.getAttribute("role")) === "status",
      "patient confirmation live region must expose role=status",
    );
    const reducedActionTransition = await patientPage
      .locator(".cross-org-artifact-action")
      .first()
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      reducedActionTransition.includes("0s"),
      `reduced-motion transition did not collapse: ${reducedActionTransition}`,
    );

    await openNetworkManageRoute(
      patientPage,
      networkManageUrl(patientBaseUrl, { scenarioId: "network_manage_330_live" }),
    );
    await waitForNetworkManageState(patientPage, {
      scenarioId: "network_manage_330_live",
      capabilityState: "live",
    });
    await assertNoHorizontalOverflow(patientPage, "334 patient manage mobile");
    const timelineView = patientPage.getByTestId("MessageTimelineClusterView");
    assertCondition(
      (await timelineView.getAttribute("aria-describedby")) === "network-manage-timeline-annotations",
      "manage timeline should stay described by the annotation block",
    );
    await patientPage.getByTestId("timeline-row-reminder_delivered_live").click();
    assertCondition(
      (await patientPage
        .getByTestId("timeline-row-reminder_delivered_live")
        .locator("button")
        .getAttribute("aria-expanded")) === "true",
      "manage timeline disclosure should expose aria-expanded",
    );
    const manageAria = await captureAria(patientPage.getByTestId("network-manage-artifact-frame"), patientPage);
    await writeAccessibilitySnapshot(patientPage, "334-cross-org-patient-family.a11y.snapshot.json");

    const hubPage = await hubContext.newPage();
    trackExternalRequests(hubPage, hubBaseUrl, externalRequests);

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-066`, "HubMissionStackLayout");
    await assertNoHorizontalOverflow(hubPage, "334 hub commit mobile");
    const hubPane = hubPage.getByTestId("HubCommitConfirmationPane");
    const hubTimeline = hubPage.getByTestId("HubCommitAttemptTimeline");
    const describedBy = await hubTimeline.getAttribute("aria-describedby");
    assertCondition(
      describedBy?.startsWith("hub-commit-timeline-annotations-") ?? false,
      "hub commit timeline should stay described by its annotation block",
    );
    const hubAria = await captureAria(hubPane, hubPage);

    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-052`, "HubMissionStackLayout");
    await assertNoHorizontalOverflow(hubPage, "334 hub recovery mobile");
    await hubPage.getByTestId("HubRecoveryCaseCanvas").waitFor();
    const recoveryAria = await captureAria(hubPage.getByTestId("HubRecoveryCaseCanvas"), hubPage);

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    writeJsonArtifact("334-cross-org-content-accessibility.aria.json", {
      confirmation: confirmationAria,
      manage: manageAria,
      hubCommit: hubAria,
      hubRecovery: recoveryAria,
    });
    await patientPage.screenshot({
      path: outputPath("334-cross-org-content-accessibility-patient.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await hubPage.screenshot({
      path: outputPath("334-cross-org-content-accessibility-hub.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    await Promise.all([
      patientContext.tracing.stop({ path: outputPath("334-cross-org-content-accessibility-patient-trace.zip") }),
      hubContext.tracing.stop({ path: outputPath("334-cross-org-content-accessibility-hub-trace.zip") }),
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
