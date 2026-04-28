import {
  appointmentFamilyUrl,
  assertCondition,
  captureAria,
  importPlaywright,
  openAppointmentFamilyRoute,
  outputPath,
  readAppointmentFamilyMarkers,
  startPatientWeb,
  startTrace,
  stopPatientWeb,
  stopTraceOnError,
  trackExternalRequests,
  waitForAppointmentFamilySelection,
  writeJsonArtifact,
} from "./337_appointment_family.helpers.ts";

export const appointmentFamilyTimelineAndRecoveryCoverage = [
  "waitlist fallback surfaces a bounded ribbon instead of stale local calmness",
  "fallback transition into hub follow-on preserves the selected family anchor",
  "returning to the appointment workspace restores the same family and shows a continuity receipt",
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
      viewport: { width: 430, height: 932 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    try {
      await openAppointmentFamilyRoute(
        page,
        appointmentFamilyUrl(baseUrl, { familyRef: "family_waitlist_fallback_due" }),
      );
      await waitForAppointmentFamilySelection(page, "family_waitlist_fallback_due");
      await page.getByTestId("HubFallbackRibbon").waitFor();
      const ribbonText = await page.getByTestId("HubFallbackRibbon").textContent();
      assertCondition(
        ribbonText?.includes("Fallback is now the governing path") ?? false,
        "waitlist fallback ribbon did not render the governing-path warning",
      );
      const timelineText = await page.getByTestId("AppointmentFamilyTimelineBridge").textContent();
      assertCondition(
        timelineText?.includes("Callback now safer") ?? false,
        "timeline bridge should carry the fallback transition context",
      );

      await page.getByTestId("appointment-family-manage-entry-action").click();
      await page.getByTestId("Patient_Network_Alternative_Choice_Route").waitFor();
      const networkRoute = await page
        .getByTestId("Patient_Network_Alternative_Choice_Route")
        .getAttribute("data-return-route-ref");
      assertCondition(
        networkRoute === "/appointments",
        `waitlist fallback should preserve appointment return target, received ${String(networkRoute)}`,
      );

      await page.getByRole("link", { name: "Appointments" }).click();
      await page.getByTestId("PatientAppointmentFamilyWorkspace").waitFor();
      const markers = await readAppointmentFamilyMarkers(page);
      assertCondition(
        markers.selectedFamilyRef === "family_waitlist_fallback_due" &&
          markers.returnAnchor === "restored",
        `return receipt or selection drifted: ${JSON.stringify(markers)}`,
      );
      const receipt = await page.getByTestId("HubLocalReturnAnchorReceipt").textContent();
      assertCondition(
        receipt?.includes("Returned with family anchor preserved") ?? false,
        "return receipt should explain preserved family continuity",
      );

      const aria = await captureAria(page.getByTestId("PatientAppointmentFamilyWorkspace"), page);
      writeJsonArtifact("337-appointment-family-timeline-and-recovery-aria.json", aria);
      await page.screenshot({
        path: outputPath("337-appointment-family-timeline-and-recovery.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );
    } catch (error) {
      await stopTraceOnError(context, "337-appointment-family-timeline-and-recovery.trace.zip", error);
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
