import {
  assertCondition,
  importPlaywright,
  openMessagesRoute,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForMessagesState,
  waitForPatientPharmacyState,
} from "./368_pharmacy_loop_merge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl: patientBaseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const pendingMessageContext = await browser.newContext({
      viewport: { width: 1280, height: 920 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const pendingMessagePage = await pendingMessageContext.newPage();
    await openMessagesRoute(pendingMessagePage, patientBaseUrl, "cluster_368_pharmacy_pending");
    await waitForMessagesState(pendingMessagePage, {
      routeKey: "message_cluster",
      clusterRef: "cluster_368_pharmacy_pending",
    });
    const pendingBraid = pendingMessagePage.getByTestId("conversation-braid");
    assertCondition(
      (await pendingBraid.getAttribute("data-pharmacy-case-id")) === "PHC-2057",
      "Pending notification braid should stay bound to PHC-2057.",
    );
    assertCondition(
      (await pendingBraid.getAttribute("data-authoritative-status")) === "Pending confirmation",
      "Pending notification braid should expose the authoritative pending-confirmation state.",
    );

    const pendingStatusContext = await browser.newContext({
      viewport: { width: 1280, height: 920 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const pendingStatusPage = await pendingStatusContext.newPage();
    await openPatientPharmacyRoute(
      pendingStatusPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2057", "status"),
    );
    await waitForPatientPharmacyState(pendingStatusPage, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
    });
    const pendingRoot = pendingStatusPage.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await pendingRoot.getAttribute("data-patient-status-surface-state")) === "dispatch_pending",
      "Pending pharmacy status should stay on the dispatch-pending surface.",
    );
    assertCondition(
      await pendingStatusPage.getByTestId("PatientPharmacyStatusSurface").isVisible(),
      "Pending pharmacy status should render the authoritative patient status surface.",
    );

    const pendingMessageText = (await pendingBraid.textContent()) ?? "";
    const pendingStatusText =
      (await pendingStatusPage.getByTestId("PatientPharmacyStatusSurface").textContent()) ?? "";
    assertCondition(
      pendingMessageText.includes("confirm the referral"),
      "Pending message braid should keep the referral-confirmation copy visible.",
    );
    assertCondition(
      pendingStatusText.includes("still pending"),
      "Pending pharmacy status should keep the same pending posture as the message braid.",
    );
    assertCondition(
      !/do not need to do anything else right now/i.test(`${pendingMessageText} ${pendingStatusText}`),
      "Pending notification and status surfaces must not use settled calm wording.",
    );

    const completedMessageContext = await browser.newContext({
      viewport: { width: 1280, height: 920 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const completedMessagePage = await completedMessageContext.newPage();
    await openMessagesRoute(completedMessagePage, patientBaseUrl, "cluster_368_pharmacy_completed");
    await waitForMessagesState(completedMessagePage, {
      routeKey: "message_cluster",
      clusterRef: "cluster_368_pharmacy_completed",
    });
    const completedBraid = completedMessagePage.getByTestId("conversation-braid");
    assertCondition(
      (await completedBraid.getAttribute("data-authoritative-status")) === "Outcome recorded",
      "Completed message braid should expose the settled outcome label.",
    );

    const completedStatusPage = await completedMessageContext.newPage();
    await openPatientPharmacyRoute(
      completedStatusPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2196", "status"),
    );
    await waitForPatientPharmacyState(completedStatusPage, {
      currentPath: "/pharmacy/PHC-2196/status",
      routeKey: "status",
      selectedCaseId: "PHC-2196",
    });
    const completedRoot = completedStatusPage.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await completedRoot.getAttribute("data-patient-status-outcome-state")) ===
        "settled_resolved",
      "Completed pharmacy status should expose the settled outcome truth.",
    );
    assertCondition(
      (await completedRoot.getAttribute("data-patient-calm-allowed")) === "true",
      "Completed pharmacy status should explicitly allow calm copy.",
    );
    const completedCombinedText = `${(await completedBraid.textContent()) ?? ""} ${
      (await completedStatusPage.getByTestId("PharmacyOutcomePage").textContent()) ?? ""
    }`;
    assertCondition(
      completedCombinedText.includes("Outcome recorded"),
      "Completed notification and status should share the same outcome-recorded posture.",
    );
    assertCondition(
      completedCombinedText.includes("do not need to do anything else right now"),
      "Completed status should keep the calm settled guidance visible once the message state also says outcome recorded.",
    );

    await Promise.all([
      pendingMessageContext.close(),
      pendingStatusContext.close(),
      completedMessageContext.close(),
    ]);
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
