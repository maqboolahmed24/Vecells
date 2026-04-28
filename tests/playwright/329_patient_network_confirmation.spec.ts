import {
  assertCondition,
  importPlaywright,
  networkConfirmationUrl,
  openNetworkConfirmationRoute,
  outputPath,
  readPatientConfirmationMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  waitForPatientConfirmationState,
} from "./329_commit_confirmation.helpers";

export const patientNetworkConfirmationCoverage = [
  "patient confirmation keeps appointment confirmed, practice informed, and practice acknowledged separate",
  "pending and drift states stay provisional or blocked instead of widening calmness",
  "the route remains responsive and embed-safe in an NHS App host posture",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const page = await browser.newPage({
      viewport: { width: 430, height: 932 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    trackExternalRequests(page, baseUrl, externalRequests);

    await openNetworkConfirmationRoute(
      page,
      networkConfirmationUrl(baseUrl, {
        scenarioId: "network_confirmation_329_pending",
      }),
    );
    let markers = await readPatientConfirmationMarkers(page);
    assertCondition(
      markers.truthState === "pending_copy",
      `pending route should stay provisional, received ${String(markers.truthState)}`,
    );
    assertCondition(
      markers.practiceInformed === "Not yet",
      `pending route should not imply practice informed, received ${String(markers.practiceInformed)}`,
    );

    await openNetworkConfirmationRoute(
      page,
      networkConfirmationUrl(baseUrl, {
        scenarioId: "network_confirmation_329_practice_informed",
      }),
    );
    await waitForPatientConfirmationState(page, {
      scenarioId: "network_confirmation_329_practice_informed",
      truthState: "calm_confirmed",
    });
    markers = await readPatientConfirmationMarkers(page);
    assertCondition(
      markers.practiceInformed?.includes("Sent to Riverside Medical"),
      `practice informed cue should be populated, received ${String(markers.practiceInformed)}`,
    );
    assertCondition(
      markers.practiceAcknowledged === "Waiting for acknowledgement",
      `practice acknowledgement should stay secondary and pending, received ${String(markers.practiceAcknowledged)}`,
    );

    await openNetworkConfirmationRoute(
      page,
      networkConfirmationUrl(baseUrl, {
        scenarioId: "network_confirmation_329_practice_acknowledged",
        host: "nhs_app",
        safeArea: "bottom",
      }),
    );
    await waitForPatientConfirmationState(page, {
      scenarioId: "network_confirmation_329_practice_acknowledged",
      truthState: "calm_confirmed",
      embeddedMode: "nhs_app",
    });
    markers = await readPatientConfirmationMarkers(page);
    assertCondition(
      markers.practiceAcknowledged === "Acknowledged at 10:31",
      `practice acknowledgement cue mismatch: ${String(markers.practiceAcknowledged)}`,
    );

    await openNetworkConfirmationRoute(
      page,
      networkConfirmationUrl(baseUrl, {
        scenarioId: "network_confirmation_329_supplier_drift",
      }),
    );
    await waitForPatientConfirmationState(page, {
      scenarioId: "network_confirmation_329_supplier_drift",
      truthState: "blocked",
    });
    await page.getByTestId("patient-confirmation-manage-stub").waitFor();
    const manageCopy = await page.getByTestId("patient-confirmation-manage-stub").textContent();
    assertCondition(
      manageCopy?.includes("temporarily frozen") ?? false,
      "supplier drift route should freeze manage posture visibly",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("329-patient-network-confirmation.png"),
      fullPage: true,
    });
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
