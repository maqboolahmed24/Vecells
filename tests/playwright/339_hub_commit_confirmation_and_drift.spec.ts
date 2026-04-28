import {
  assertCondition,
  assertHubCommitProjection,
  captureAria,
  expectedCommitProjection,
  importPlaywright,
  openHubRoute,
  outputPath,
  readHubCommitMarkers,
  startHubDesk,
  startTrace,
  stopHubDesk,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForHubCommitPosture,
  waitForHubRootState,
  writeJsonArtifact,
} from "./339_commit_mesh_no_slot_reopen.helpers.ts";

export const hubCommitMeshCoverage339 = [
  "commit calmness is pinned to the governing truth posture, not provisional transport or raw button state",
  "manual proof, imported review, and supplier drift remain distinct browser-visible postures",
  "practice acknowledgement debt stays separate from booked calmness and supplier confirmation",
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
    await startTrace(context);

    try {
      const page = await context.newPage();
      trackExternalRequests(page, baseUrl, externalRequests);

      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
      await waitForHubRootState(page, {
        currentPath: "/hub/case/hub-case-104",
        viewMode: "case",
        selectedCaseId: "hub-case-104",
      });
      await assertHubCommitProjection(page, "candidate_revalidation");

      await page.getByTestId("hub-begin-native-booking").click();
      await waitForHubCommitPosture(page, "native_booking_pending");
      await assertHubCommitProjection(page, "native_booking_pending");
      await page.getByTestId("ManualNativeBookingProofModal").waitFor();
      assertCondition(
        (await page.getByTestId("ManualNativeBookingProofModal").getAttribute("role")) === "dialog",
        "manual proof modal must expose dialog semantics",
      );
      const manualProofAria = await captureAria(
        page.getByTestId("ManualNativeBookingProofModal"),
        page,
      );

      await page.getByRole("button", { name: "Attach reviewed manual proof" }).click();
      await waitForHubCommitPosture(page, "confirmation_pending");
      await assertHubCommitProjection(page, "confirmation_pending");

      await page.getByTestId("hub-record-supplier-confirmation").click();
      await waitForHubCommitPosture(page, "booked_pending_practice_ack");
      await assertHubCommitProjection(page, "booked_pending_practice_ack");

      await page.getByRole("button", { name: "Show evidence" }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='ContinuityDeliveryEvidenceDrawer']")
            ?.getAttribute("data-open") === "true",
      );
      const continuityAria = await captureAria(
        page.getByTestId("ContinuityDeliveryEvidenceDrawer"),
        page,
      );

      await page.getByTestId("hub-mark-practice-acknowledged").click();
      await waitForHubCommitPosture(page, "booked");
      await assertHubCommitProjection(page, "booked");

      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-087`, "hub-case-route");
      await waitForHubCommitPosture(page, "confirmation_pending");
      await page.getByTestId("hub-toggle-imported-review").click();
      await waitForHubCommitPosture(page, "disputed");
      await assertHubCommitProjection(page, "disputed");
      const disputedProjection = expectedCommitProjection("disputed");
      const disputedText =
        (await page.getByTestId("ImportedConfirmationReviewPanel").textContent()) ?? "";
      assertCondition(
        disputedText.includes(disputedProjection.importedReview?.summary ?? ""),
        "imported review panel lost the disputed summary",
      );

      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-041`, "hub-case-route");
      await waitForHubCommitPosture(page, "supplier_drift");
      await assertHubCommitProjection(page, "supplier_drift");
      const driftMarkers = await readHubCommitMarkers(page);
      assertCondition(driftMarkers.supplierDrift === 1, "supplier drift banner should render once");

      writeJsonArtifact("339-hub-commit-confirmation-and-drift.json", {
        candidateRevalidation: expectedCommitProjection("candidate_revalidation").truthLabel,
        nativeBookingPending: expectedCommitProjection("native_booking_pending").truthLabel,
        confirmationPending: expectedCommitProjection("confirmation_pending").truthLabel,
        bookedPendingPracticeAck: expectedCommitProjection("booked_pending_practice_ack").truthLabel,
        booked: expectedCommitProjection("booked").truthLabel,
        disputed: expectedCommitProjection("disputed").truthLabel,
        supplierDrift: {
          truthLabel: expectedCommitProjection("supplier_drift").truthLabel,
          markers: driftMarkers,
        },
        aria: {
          manualProofModal: manualProofAria,
          continuityDrawer: continuityAria,
        },
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await page.screenshot({
        path: outputPath("339-hub-commit-confirmation-and-drift.png"),
        fullPage: true,
      });
      await stopTrace(context, "339-hub-commit-confirmation-and-drift-trace.zip");
    } catch (error) {
      await stopTraceOnError(context, "339-hub-commit-confirmation-and-drift-trace.zip", error);
    } finally {
      await context.close();
    }
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
