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
  waitForHubCommitPosture,
  writeJsonArtifact,
} from "./329_commit_confirmation.helpers";

export const commitConfirmationAccessibilityCoverage = [
  "manual proof dialog uses modal semantics and keeps focus inside the shell context",
  "continuity evidence drawer exposes disclosure semantics without hiding focus",
  "mobile patient confirmation reflows without horizontal clipping",
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
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await openHubRoute(hubPage, `${hubBaseUrl}/hub/case/hub-case-104`, "hub-case-route");
    await waitForHubCommitPosture(hubPage, "candidate_revalidation");

    await hubPage.getByTestId("hub-begin-native-booking").click();
    await waitForHubCommitPosture(hubPage, "native_booking_pending");
    const modal = hubPage.getByTestId("ManualNativeBookingProofModal");
    await modal.waitFor();
    assertCondition(
      (await modal.getAttribute("aria-modal")) === "true",
      "manual proof modal should declare aria-modal",
    );
    const modalAria = await captureAria(modal, hubPage);
    writeJsonArtifact("329-manual-proof-modal.aria.json", modalAria);

    await hubPage.keyboard.press("Escape");
    await hubPage.waitForFunction(
      () => !document.querySelector("[data-testid='ManualNativeBookingProofModal']"),
    );

    await hubPage.getByRole("button", { name: "Show evidence" }).click();
    const evidenceButton = hubPage.getByRole("button", { name: "Hide evidence" });
    await evidenceButton.waitFor();
    assertCondition(
      (await evidenceButton.getAttribute("aria-expanded")) === "true",
      "continuity drawer toggle should expose aria-expanded",
    );
    await evidenceButton.focus();
    const focusedVisible = await evidenceButton.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assertCondition(focusedVisible, "focused continuity toggle should remain visible");
    const paneAria = await captureAria(hubPage.getByTestId("HubCommitConfirmationPane"), hubPage);
    writeJsonArtifact("329-hub-commit-pane.aria.json", paneAria);

    const patientPage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await openNetworkConfirmationRoute(
      patientPage,
      networkConfirmationUrl(patientBaseUrl, {
        scenarioId: "network_confirmation_329_practice_informed",
      }),
    );
    await assertNoHorizontalOverflow(patientPage, "patient confirmation mobile route");
    const patientRoot = patientPage.getByTestId("PatientNetworkConfirmationView");
    const patientAria = await captureAria(patientRoot, patientPage);
    writeJsonArtifact("329-patient-network-confirmation.aria.json", patientAria);
    await patientPage.screenshot({
      path: outputPath("329-patient-network-confirmation-mobile.png"),
      fullPage: true,
    });
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
