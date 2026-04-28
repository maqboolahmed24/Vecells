import {
  BOOKING_309_PATIENT_PATHS,
  BOOKING_309_STAFF_PATHS,
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  assertNoExternalRequests,
  assertNoHorizontalOverflow,
  openBookingRoute,
  openStaffBookingRoute,
  outputPath,
  patientPathUrl,
  readConfirmationMarkers,
  readManageMarkers,
  readPatientWorkspaceMarkers,
  readStaffMarkers,
  readWorkspaceReturnBinder,
  startLocalBookingApps,
  stopLocalBookingApps,
  trackExternalRequests,
  importPlaywright,
} from "./309_phase4_local_booking.helpers.ts";

export const patientStaffLocalBookingE2ECoverage = [
  "patient self-service flow moves from lawful launch into selection, pre-commit review, confirmation pending, confirmed truth, and writable manage posture",
  "staff-assisted flow keeps compare-live, pending-confirmation, and recovery-required truth visible in the governed staff shell",
  "patient and staff recovery postures remain aligned when reconciliation or stale-owner recovery is still unresolved",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const apps = await startLocalBookingApps();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await patientContext.tracing.start({ screenshots: true, snapshots: true });
    await staffContext.tracing.start({ screenshots: true, snapshots: true });

    const patientPage = await patientContext.newPage();
    const staffPage = await staffContext.newPage();
    const patientExternalRequests = new Set<string>();
    const staffExternalRequests = new Set<string>();
    trackExternalRequests(patientPage, apps.patientBaseUrl, patientExternalRequests);
    trackExternalRequests(staffPage, apps.staffBaseUrl, staffExternalRequests);

    await openBookingRoute(patientPage, patientPathUrl(apps.patientBaseUrl, "homeWorkspace"));
    let patientMarkers = await readPatientWorkspaceMarkers(patientPage);
    assertCondition(patientMarkers.originKey === "home", "patient home origin drifted");
    assertCondition(
      patientMarkers.routeKey === "workspace",
      "patient home route should open the workspace host",
    );
    const homeBinder = await readWorkspaceReturnBinder(patientPage);
    assertCondition(homeBinder.returnRouteRef === "/home", "patient home return route drifted");
    assertCondition(Boolean(homeBinder.shellContinuityKey), "patient home continuity key missing");

    await patientPage.getByTestId("booking-primary-action").click();
    await patientPage.waitForFunction(() => {
      return (
        document
          .querySelector("[data-testid='Patient_Booking_Workspace_Route']")
          ?.getAttribute("data-route-key") === "select"
      );
    });
    patientMarkers = await readPatientWorkspaceMarkers(patientPage);
    assertCondition(
      patientMarkers.routeKey === "select",
      "patient flow should navigate to selection",
    );
    assertCondition(
      Boolean(patientMarkers.selectedAnchorRef),
      "patient selection should preserve a selected anchor",
    );

    await openBookingRoute(patientPage, patientPathUrl(apps.patientBaseUrl, "selection"));
    patientMarkers = await readPatientWorkspaceMarkers(patientPage);
    assertCondition(
      patientMarkers.routeKey === "select",
      "dedicated patient selection fixture should stay on the selection host",
    );

    await patientPage.getByTestId("booking-slot-continue").click();
    await patientPage.waitForFunction(() => {
      return (
        document
          .querySelector("[data-testid='Patient_Booking_Workspace_Route']")
          ?.getAttribute("data-route-key") === "confirm"
      );
    });
    let confirmationMarkers = await readConfirmationMarkers(patientPage);
    assertCondition(
      confirmationMarkers.confirmationTruth === "pre_commit_review",
      "patient confirmation review truth drifted",
    );

    await openBookingRoute(patientPage, patientPathUrl(apps.patientBaseUrl, "confirmationPending"));
    confirmationMarkers = await readConfirmationMarkers(patientPage);
    assertCondition(
      confirmationMarkers.confirmationTruth === "confirmation_pending",
      "patient confirmation-pending truth drifted",
    );
    assertCondition(
      ((await patientPage.getByTestId("booking-confirmation-stage").textContent()) ?? "")
        .toLowerCase()
        .includes("confirmed booking") === false,
      "patient confirmation-pending route must not imply a confirmed booking",
    );

    await openBookingRoute(
      patientPage,
      patientPathUrl(apps.patientBaseUrl, "confirmationConfirmed"),
    );
    confirmationMarkers = await readConfirmationMarkers(patientPage);
    assertCondition(
      confirmationMarkers.confirmationTruth === "confirmed",
      "patient confirmed truth drifted",
    );
    assertCondition(
      confirmationMarkers.artifactExposure === "handoff_ready",
      "patient confirmed route should expose artifact readiness",
    );

    await openBookingRoute(patientPage, patientPathUrl(apps.patientBaseUrl, "manageReady"));
    const manageMarkers = await readManageMarkers(patientPage);
    assertCondition(
      manageMarkers.manageExposure === "writable",
      "patient manage route should remain writable",
    );
    assertCondition(
      manageMarkers.confirmationTruth === "confirmed",
      "patient manage route should remain bound to confirmed truth",
    );
    assertCondition(
      (await patientPage.locator("main").count()) === 1,
      "patient manage route should expose one main landmark",
    );
    await assertNoHorizontalOverflow(patientPage, "309 patient manage desktop");
    await patientPage.screenshot({
      path: outputPath("309-patient-local-booking-e2e.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openStaffBookingRoute(staffPage, apps.staffBaseUrl, BOOKING_309_STAFF_PATHS.compareLive);
    let staffMarkers = await readStaffMarkers(staffPage);
    assertCondition(
      staffMarkers.bookingCase === "booking_case_299_compare_live",
      "staff compare-live booking case drifted",
    );
    assertCondition(
      staffMarkers.reviewLeaseState === "live",
      "staff compare-live lease state drifted",
    );
    assertCondition(
      staffMarkers.confirmationTruth === "pre_commit_review",
      "staff compare-live truth drifted",
    );
    await staffPage.getByTestId("booking-compare-slot-slot_299_compare_1530").click();
    await staffPage.getByTestId("AssistedSlotCompareStage").waitFor();

    await openStaffBookingRoute(
      staffPage,
      apps.staffBaseUrl,
      BOOKING_309_STAFF_PATHS.pendingConfirmation,
    );
    staffMarkers = await readStaffMarkers(staffPage);
    assertCondition(
      staffMarkers.confirmationTruth === "confirmation_pending",
      "staff pending-confirmation truth drifted",
    );
    assertCondition(
      staffMarkers.taskSettlement === "pending_settlement",
      "staff pending-confirmation settlement drifted",
    );
    assertCondition(
      ((await staffPage.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR).textContent()) ?? "")
        .toLowerCase()
        .includes("confirmed booking") === false,
      "staff pending-confirmation route must not imply a confirmed booking",
    );

    await openBookingRoute(
      patientPage,
      patientPathUrl(apps.patientBaseUrl, "confirmationReconciliation"),
    );
    confirmationMarkers = await readConfirmationMarkers(patientPage);
    assertCondition(
      confirmationMarkers.confirmationTruth === "reconciliation_required",
      "patient reconciliation truth drifted",
    );
    assertCondition(
      confirmationMarkers.manageExposure === "hidden",
      "patient reconciliation route must hide manage exposure",
    );

    await openStaffBookingRoute(
      staffPage,
      apps.staffBaseUrl,
      BOOKING_309_STAFF_PATHS.staleRecovery,
    );
    staffMarkers = await readStaffMarkers(staffPage);
    assertCondition(
      staffMarkers.confirmationTruth === "reconciliation_required",
      "staff stale-recovery truth drifted",
    );
    assertCondition(
      staffMarkers.taskSettlement === "reacquire_required",
      "staff stale-recovery settlement drifted",
    );
    assertCondition(
      staffMarkers.exceptionClass === "stale_owner_or_publication_drift",
      "staff stale-recovery exception class drifted",
    );
    await assertNoHorizontalOverflow(staffPage, "309 staff assisted booking desktop");
    await staffPage.screenshot({
      path: outputPath("309-staff-local-booking-e2e.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertNoExternalRequests(
      "309 patient and staff local booking e2e",
      patientExternalRequests,
      staffExternalRequests,
    );

    await patientContext.tracing.stop({
      path: outputPath("309-patient-local-booking-e2e-trace.zip"),
    });
    await staffContext.tracing.stop({
      path: outputPath("309-staff-local-booking-e2e-trace.zip"),
    });
    await patientContext.close();
    await staffContext.close();
  } finally {
    await browser.close();
    await stopLocalBookingApps(apps);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
