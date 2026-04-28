import {
  appointmentFamilyUrl,
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openAppointmentFamilyRoute,
  outputPath,
  readAppointmentFamilyMarkers,
  requestDetailUrl,
  startPatientWeb,
  startTrace,
  stopPatientWeb,
  stopTraceOnError,
  trackExternalRequests,
  waitForAppointmentFamilySelection,
  writeAccessibilitySnapshot,
  writeJsonArtifact,
} from "./337_appointment_family.helpers.ts";

export const appointmentFamilyListAndDetailCoverage = [
  "appointments list renders local, network, waitlist, and callback family members in one grammar",
  "local and network calm confirmation use the same primary wording while keeping distinct authority refs",
  "request detail can open the same appointment family workspace without dropping the selected family anchor",
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
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    try {
      await openAppointmentFamilyRoute(page, appointmentFamilyUrl(baseUrl));
      const markers = await readAppointmentFamilyMarkers(page);
      assertCondition(
        markers.selectedFamilyRef === "family_local_confirmed",
        `default family should select local appointment, received ${String(markers.selectedFamilyRef)}`,
      );

      const rows = await page.locator("[data-family-ref]").evaluateAll((nodes) =>
        nodes.map((node) => ({
          familyRef: node.getAttribute("data-family-ref"),
          truthSource: node.getAttribute("data-truth-source"),
          statusState: node.getAttribute("data-status-state"),
          text: (node.textContent || "").replace(/\s+/g, " ").trim(),
        })),
      );
      assertCondition(rows.length >= 4, `expected 4 appointment family rows, received ${rows.length}`);
      const localRow = rows.find((row) => row.familyRef === "family_local_confirmed");
      const networkRow = rows.find((row) => row.familyRef === "family_network_live");
      assertCondition(Boolean(localRow), "local family row missing");
      assertCondition(Boolean(networkRow), "network family row missing");
      assertCondition(
        localRow?.truthSource === "BookingConfirmationTruthProjection",
        `local family should bind booking truth, received ${String(localRow?.truthSource)}`,
      );
      assertCondition(
        networkRow?.truthSource === "HubOfferToConfirmationTruthProjection",
        `network family should bind hub truth, received ${String(networkRow?.truthSource)}`,
      );
      assertCondition(
        localRow?.text.includes("Appointment confirmed") &&
          networkRow?.text.includes("Appointment confirmed"),
        "equivalent confirmed wording did not appear on both local and network rows",
      );

      await page.getByTestId("appointment-family-row-family_network_live").click();
      await waitForAppointmentFamilySelection(page, "family_network_live");
      const detail = await page.getByTestId("appointment-family-detail-panel").textContent();
      assertCondition(
        detail?.includes("Practice informed") ?? false,
        "network detail should preserve practice-informed nuance",
      );

      await page.goto(requestDetailUrl(baseUrl), { waitUntil: "networkidle" });
      await page.getByTestId("PatientRequestDownstreamWorkRail").waitFor();
      const railCount = await page
        .getByTestId("PatientRequestDownstreamWorkRail")
        .getAttribute("data-family-count");
      assertCondition(railCount === "4", `request work rail should expose 4 family rows, received ${String(railCount)}`);
      await page.getByTestId("appointment-family-open-family_network_live").click();
      await page.getByTestId("PatientAppointmentFamilyWorkspace").waitFor();
      const requestEntryMarkers = await readAppointmentFamilyMarkers(page);
      assertCondition(
        requestEntryMarkers.entrySource === "request_detail" &&
          requestEntryMarkers.selectedFamilyRef === "family_network_live",
        `request-detail handoff drifted: ${JSON.stringify(requestEntryMarkers)}`,
      );

      await assertNoHorizontalOverflow(page, "337 appointment family workspace");
      writeJsonArtifact("337-appointment-family-list-and-detail.json", { rows, markers, requestEntryMarkers });
      writeAccessibilitySnapshot(page, "337-appointment-family-list-and-detail-accessibility.json");
      const ariaSnapshot = await captureAria(page.getByTestId("PatientAppointmentFamilyWorkspace"), page);
      writeJsonArtifact("337-appointment-family-list-and-detail-aria.json", ariaSnapshot);
      await page.screenshot({
        path: outputPath("337-appointment-family-list-and-detail.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );
    } catch (error) {
      await stopTraceOnError(context, "337-appointment-family-list-and-detail.trace.zip", error);
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
