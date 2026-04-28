import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientAppointmentManageRescheduleCoverage = [
  "reschedule opens inside the manage route",
  "the booked summary remains visible while replacement selection is open",
  "replacement selection reuses the 295 slot-selection stage",
  "continue keeps the route in-manage and moves to pending posture",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1024 } });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );

    const manageRoot = page.getByTestId("patient-appointment-manage-view");
    const summaryCard = page.getByTestId("appointment-summary-card");
    await page.getByTestId("manage-action-open_reschedule").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "reschedule_active";
    });

    assertCondition(
      await page.getByTestId("reschedule-entry-stage").isVisible(),
      "reschedule entry stage should render inside the manage route",
    );
    assertCondition(
      await summaryCard.isVisible(),
      "booked summary must remain visible while reschedule is active",
    );
    assertCondition(
      await page.getByTestId("sticky-confirm-tray").isVisible(),
      "reschedule should reuse the offer-selection sticky confirm tray",
    );
    assertCondition(
      (await page.url()).includes("/manage"),
      "reschedule should stay in the manage route instead of navigating to select or confirm",
    );

    await page.getByTestId("sticky-confirm-continue").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "reschedule_pending";
    });

    assertCondition(
      await summaryCard.isVisible(),
      "booked summary must remain visible while the replacement appointment is pending",
    );
    assertCondition(
      await page.getByText("We are checking the replacement appointment before changing the original one.").isVisible(),
      "same-shell replacement pending state should render after continuing",
    );
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
