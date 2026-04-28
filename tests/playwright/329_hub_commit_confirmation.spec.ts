import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  readHubCommitMarkers,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubCommitPosture,
  waitForHubRootState,
} from "./329_commit_confirmation.helpers";

export const hubCommitConfirmationCoverage = [
  "candidate revalidation stays visibly weaker than booked truth",
  "manual native proof remains structured and review-first inside the shell",
  "booked, practice informed, practice acknowledged, imported dispute, and supplier drift stay visually separate",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1520, height: 1180 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      selectedCaseId: "hub-case-104",
    });

    let markers = await readHubCommitMarkers(page);
    assertCondition(
      markers.posture === "candidate_revalidation",
      `expected candidate revalidation, received ${String(markers.posture)}`,
    );

    await page.getByTestId("hub-begin-native-booking").click();
    await waitForHubCommitPosture(page, "native_booking_pending");
    await page.getByTestId("ManualNativeBookingProofModal").waitFor();
    assertCondition(
      (await page.getByTestId("ManualNativeBookingProofModal").getAttribute("role")) === "dialog",
      "manual proof modal must expose dialog semantics",
    );

    await page.getByRole("button", { name: "Attach reviewed manual proof" }).click();
    await waitForHubCommitPosture(page, "confirmation_pending");

    await page.getByTestId("hub-record-supplier-confirmation").click();
    await waitForHubCommitPosture(page, "booked_pending_practice_ack");
    markers = await readHubCommitMarkers(page);
    assertCondition(
      markers.acknowledgementState === "ack_pending",
      `expected ack_pending after supplier confirmation, received ${String(markers.acknowledgementState)}`,
    );

    await page.getByRole("button", { name: "Show evidence" }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='ContinuityDeliveryEvidenceDrawer']")
          ?.getAttribute("data-open") === "true",
    );
    await page.getByTestId("hub-mark-practice-acknowledged").click();
    await waitForHubCommitPosture(page, "booked");
    markers = await readHubCommitMarkers(page);
    assertCondition(
      markers.acknowledgementState === "acknowledged",
      `expected acknowledged after practice ack, received ${String(markers.acknowledgementState)}`,
    );

    await page.goto(`${baseUrl}/hub/case/hub-case-087`, { waitUntil: "networkidle" });
    await waitForHubCommitPosture(page, "confirmation_pending");
    await page.getByTestId("hub-toggle-imported-review").click();
    await waitForHubCommitPosture(page, "disputed");
    await page.getByTestId("ImportedConfirmationReviewPanel").waitFor();

    await page.goto(`${baseUrl}/hub/case/hub-case-041`, { waitUntil: "networkidle" });
    await waitForHubCommitPosture(page, "supplier_drift");
    markers = await readHubCommitMarkers(page);
    assertCondition(markers.supplierDrift === 1, "supplier drift banner should render once");
    assertCondition(
      markers.managePosture === "frozen",
      `supplier drift should freeze manage posture, received ${String(markers.managePosture)}`,
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("329-hub-commit-confirmation.png"),
      fullPage: true,
    });
    await context.tracing.stop({ path: outputPath("329-hub-commit-confirmation-trace.zip") });
    await context.close();
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
