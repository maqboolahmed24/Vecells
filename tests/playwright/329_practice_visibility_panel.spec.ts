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
  waitForHubCommitPosture,
} from "./329_commit_confirmation.helpers";

export const practiceVisibilityCoverage = [
  "practice visibility stays minimum-necessary and does not widen hub-only detail",
  "acknowledgement debt is explicit for booked-pending-practice-ack cases",
  "practice-facing wording matches the patient confirmation wording where policy allows",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [
    { child: hubChild, baseUrl: hubBaseUrl },
    { child: patientChild, baseUrl: patientBaseUrl },
  ] = await Promise.all([startHubDesk(), startPatientWeb()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const hubPage = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-066`, "hub-case-route");
    await waitForHubCommitPosture(hubPage, "booked_pending_practice_ack");

    const practicePanel = hubPage.getByTestId("PracticeVisibilityPanel");
    const practiceText = (await practicePanel.textContent()) ?? "";
    assertCondition(
      !practiceText.includes("RANK-") && !practiceText.includes("BTX-"),
      "practice panel should not widen hub-only rank or commit attempt identifiers",
    );
    assertCondition(
      practiceText.includes("Acknowledgement overdue"),
      "practice acknowledgement debt should remain dominant when pending",
    );

    const patientPage = await browser.newPage({
      viewport: { width: 430, height: 932 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await openNetworkConfirmationRoute(
      patientPage,
      networkConfirmationUrl(patientBaseUrl, {
        scenarioId: "network_confirmation_329_practice_informed",
      }),
    );
    const patientDisclosure =
      (await patientPage.getByTestId("patient-confirmation-disclosure-strip").textContent()) ?? "";
    assertCondition(
      practiceText.includes("Appointment confirmed") &&
        patientDisclosure.includes("Appointment confirmed"),
      "practice panel secondary disclosure should match patient-facing confirmation wording",
    );

    await hubPage.goto(`${hubBaseUrl}/hub/case/hub-case-041`, { waitUntil: "networkidle" });
    await waitForHubCommitPosture(hubPage, "supplier_drift");
    const driftAck = await hubPage
      .getByTestId("PracticeAcknowledgementIndicator")
      .getAttribute("data-acknowledgement-state");
    assertCondition(
      driftAck === "reopened_by_drift",
      `supplier drift should reopen acknowledgement debt, received ${String(driftAck)}`,
    );

    await practicePanel.screenshot({ path: outputPath("329-practice-visibility-panel.png") });
  } finally {
    await browser.close();
    await Promise.all([stopHubDesk(hubChild), stopPatientWeb(patientChild)]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
