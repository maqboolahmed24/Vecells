import {
  appointmentFamilyUrl,
  assertCondition,
  importPlaywright,
  openAppointmentFamilyRoute,
  outputPath,
  readAppointmentFamilyMarkers,
  startPatientWeb,
  startTrace,
  stopPatientWeb,
  stopTraceOnError,
  trackExternalRequests,
} from "./337_appointment_family.helpers.ts";

export const appointmentManageEntryResolutionCoverage = [
  "local confirmed families resolve into local manage routes",
  "hub-managed families resolve into network manage routes",
  "pending hub truth suppresses stale calm CTAs and opens read-only network status instead",
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
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    try {
      await openAppointmentFamilyRoute(
        page,
        appointmentFamilyUrl(baseUrl, { familyRef: "family_local_confirmed" }),
      );
      let actionLabel = await page
        .getByTestId("appointment-family-manage-entry-action")
        .textContent();
      assertCondition(
        actionLabel === "Open local manage",
        `local manage action mismatch: ${String(actionLabel)}`,
      );
      await page.getByTestId("appointment-family-manage-entry-action").click();
      await page.getByTestId("Patient_Booking_Workspace_Route").waitFor();
      let routeKey = await page
        .getByTestId("Patient_Booking_Workspace_Route")
        .getAttribute("data-route-key");
      assertCondition(routeKey === "manage", `local route should open manage, received ${String(routeKey)}`);

      await openAppointmentFamilyRoute(
        page,
        appointmentFamilyUrl(baseUrl, { familyRef: "family_network_live" }),
      );
      actionLabel = await page
        .getByTestId("appointment-family-manage-entry-action")
        .textContent();
      assertCondition(
        actionLabel === "Open network manage",
        `network manage action mismatch: ${String(actionLabel)}`,
      );
      await page.getByTestId("appointment-family-manage-entry-action").click();
      await page.getByTestId("Patient_Network_Manage_Route").waitFor();
      let manageState = await page
        .getByTestId("Patient_Network_Manage_Route")
        .getAttribute("data-manage-read-only-mode");
      assertCondition(
        manageState === "interactive",
        `network live route should stay interactive, received ${String(manageState)}`,
      );

      await openAppointmentFamilyRoute(
        page,
        appointmentFamilyUrl(baseUrl, {
          familyRef: "family_network_live",
          variant: "pending",
        }),
      );
      const markers = await readAppointmentFamilyMarkers(page);
      assertCondition(markers.selectedFamilyRef === "family_network_live", "pending selection drifted");
      const resolver = page.getByTestId("AppointmentManageEntryResolver");
      assertCondition(
        (await resolver.getAttribute("data-resolution-kind")) === "read_only",
        "pending network route should degrade to a read-only resolution",
      );
      assertCondition(
        (await resolver.getAttribute("data-stale-cta-suppressed")) === "true",
        "pending network route should suppress stale CTAs",
      );
      actionLabel = await page
        .getByTestId("appointment-family-manage-entry-action")
        .textContent();
      assertCondition(
        actionLabel === "Review network status",
        `pending network action mismatch: ${String(actionLabel)}`,
      );
      await page.getByTestId("appointment-family-manage-entry-action").click();
      await page.getByTestId("Patient_Network_Manage_Route").waitFor();
      manageState = await page
        .getByTestId("Patient_Network_Manage_Route")
        .getAttribute("data-manage-read-only-mode");
      const scenario = await page
        .getByTestId("Patient_Network_Manage_Route")
        .getAttribute("data-manage-scenario");
      assertCondition(
        manageState === "read_only" && scenario === "network_manage_330_read_only",
        `pending network resolution drifted: readOnly=${String(manageState)} scenario=${String(scenario)}`,
      );

      await page.screenshot({
        path: outputPath("337-appointment-manage-entry-resolution.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );
    } catch (error) {
      await stopTraceOnError(context, "337-appointment-manage-entry-resolution.trace.zip", error);
    }

    await context.close();
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
