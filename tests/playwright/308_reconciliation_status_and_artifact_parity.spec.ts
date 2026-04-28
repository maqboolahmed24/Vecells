import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";
import { bookingArtifactUrl, readArtifactMarkers } from "./303_booking_artifact_parity.helpers.ts";
import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  openStaffBookingRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  waitForStaffBookingCase,
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const reconciliationStatusAndArtifactParityCoverage = [
  "confirmed and reconciliation-required patient postures stay visibly distinct in isolated browser contexts",
  "reconciliation artifact routes remain recovery-only and never grant detached export calmness",
  "staff reconciliation posture stays aligned with the patient recovery surface",
  "patient and staff recovery surfaces preserve accessibility and zero external-request drift",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible reconciliation root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "reconciliation accessibility snapshot missing");
  return snapshot;
}

function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: staffChild, baseUrl: staffBaseUrl },
  ] = await Promise.all([startPatientWeb(), startClinicalWorkspace()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const artifactContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await patientContext.tracing.start({ screenshots: true, snapshots: true });
    await artifactContext.tracing.start({ screenshots: true, snapshots: true });
    await staffContext.tracing.start({ screenshots: true, snapshots: true });

    const patientPage = await patientContext.newPage();
    const artifactPage = await artifactContext.newPage();
    const staffPage = await staffContext.newPage();
    const patientExternalRequests = new Set<string>();
    const artifactExternalRequests = new Set<string>();
    const staffExternalRequests = new Set<string>();
    trackExternalRequests(patientPage, patientBaseUrl, patientExternalRequests);
    trackExternalRequests(artifactPage, patientBaseUrl, artifactExternalRequests);
    trackExternalRequests(staffPage, staffBaseUrl, staffExternalRequests);

    await openBookingRoute(
      patientPage,
      `${patientBaseUrl}/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments`,
    );
    const confirmationStage = patientPage.getByTestId("booking-confirmation-stage");
    await confirmationStage.waitFor();
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) === "confirmed",
      "confirmed patient confirmation marker drifted",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-artifact-exposure")) === "handoff_ready",
      "confirmed patient route should unlock artifact exposure",
    );

    await openBookingRoute(
      patientPage,
      `${patientBaseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) ===
        "reconciliation_required",
      "reconciliation patient confirmation marker drifted",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-manage-exposure")) === "hidden",
      "reconciliation patient route must not expose manage actions",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-artifact-exposure")) === "hidden",
      "reconciliation patient route must not expose artifact calmness",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-patient-visibility")) === "recovery_required",
      "reconciliation patient route should keep recovery-required visibility explicit",
    );
    assertCondition(
      ((await confirmationStage.textContent()) ?? "").toLowerCase().includes("booking complete") ===
        false,
      "reconciliation patient route must not show confirmation-page calmness",
    );
    await writeAccessibilitySnapshot(
      patientPage,
      "308-reconciliation-confirmation-accessibility.json",
    );
    writeAriaFile(
      "308-reconciliation-confirmation-aria.yml",
      await captureAria(confirmationStage, patientPage),
    );
    await assertNoHorizontalOverflow(patientPage, "308 patient reconciliation desktop");

    await openBookingRoute(artifactPage, bookingArtifactUrl(patientBaseUrl, "confirmedCalendar"));
    let artifactMarkers = await readArtifactMarkers(artifactPage);
    assertCondition(
      artifactMarkers.grantState === "granted",
      "confirmed artifact route should keep external grant posture",
    );
    assertCondition(
      artifactMarkers.parityPosture === "verified",
      "confirmed artifact route should stay fully verified",
    );

    await openBookingRoute(
      artifactPage,
      `${patientBaseUrl}/bookings/booking_case_296_reconciliation/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=receipt`,
    );
    artifactMarkers = await readArtifactMarkers(artifactPage);
    assertCondition(
      artifactMarkers.parityPosture === "recovery_only",
      "reconciliation artifact route must degrade to recovery-only parity",
    );
    assertCondition(
      artifactMarkers.grantState === "blocked",
      "reconciliation artifact route must block detached export or handoff",
    );
    assertCondition(
      artifactMarkers.handoffReadiness === "blocked",
      "reconciliation artifact route must block browser handoff readiness",
    );
    assertCondition(
      artifactMarkers.artifactSource === "confirm",
      "reconciliation artifact route should preserve confirm-source provenance",
    );
    await artifactPage.screenshot({
      path: outputPath("308-reconciliation-artifact-parity.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openStaffBookingRoute(
      staffPage,
      staffBaseUrl,
      "/workspace/bookings/booking_case_299_stale_recovery",
    );
    await waitForStaffBookingCase(staffPage, "booking_case_299_stale_recovery");
    const staffRoute = staffPage.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    await staffRoute.waitFor();
    assertCondition(
      (await staffRoute.getAttribute("data-confirmation-truth")) === "reconciliation_required",
      "staff reconciliation marker drifted",
    );
    assertCondition(
      (await staffRoute.getAttribute("data-exception-class")) ===
        "stale_owner_or_publication_drift",
      "staff reconciliation exception class drifted",
    );
    assertCondition(
      (await staffRoute.getAttribute("data-task-settlement")) === "reacquire_required",
      "staff reconciliation settlement posture drifted",
    );
    assertCondition(
      await staffPage.getByTestId("AssistedBookingRecoveryPanel").isVisible(),
      "staff reconciliation route should keep recovery content visible",
    );
    assertCondition(
      ((await staffRoute.textContent()) ?? "").toLowerCase().includes("confirmed booking") ===
        false,
      "staff reconciliation route must not imply a final confirmed booking",
    );
    await writeAccessibilitySnapshot(staffPage, "308-reconciliation-staff-accessibility.json");
    writeAriaFile("308-reconciliation-staff-aria.yml", await captureAria(staffRoute, staffPage));
    await assertNoHorizontalOverflow(staffPage, "308 staff reconciliation desktop");

    assertCondition(
      patientExternalRequests.size === 0,
      `patient reconciliation surface fetched unexpected external resources: ${Array.from(patientExternalRequests).join(", ")}`,
    );
    assertCondition(
      artifactExternalRequests.size === 0,
      `artifact reconciliation surface fetched unexpected external resources: ${Array.from(artifactExternalRequests).join(", ")}`,
    );
    assertCondition(
      staffExternalRequests.size === 0,
      `staff reconciliation surface fetched unexpected external resources: ${Array.from(staffExternalRequests).join(", ")}`,
    );

    await patientContext.tracing.stop({
      path: outputPath("308-reconciliation-patient-trace.zip"),
    });
    await artifactContext.tracing.stop({
      path: outputPath("308-reconciliation-artifact-trace.zip"),
    });
    await staffContext.tracing.stop({
      path: outputPath("308-reconciliation-staff-trace.zip"),
    });
    await patientContext.close();
    await artifactContext.close();
    await staffContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
    await stopClinicalWorkspace(staffChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
