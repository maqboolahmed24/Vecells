import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingConfirmationCoverage = [
  "slot selection can enter the confirm route in the same shell",
  "confirm review morphs to booking in progress and pending confirmation",
  "pending state survives refresh safely",
  "confirmed summary unlocks manage and artifact exposure only after truth is final",
  "reconciliation state stays in shell without booked reassurance",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("sticky-confirm-continue").click();
    await page.waitForURL(/\/confirm\?/);

    const stage = page.getByTestId("booking-confirmation-stage");
    await stage.waitFor();
    assertCondition(
      (await stage.getAttribute("data-confirmation-truth")) === "pre_commit_review",
      "confirm route should start in review posture",
    );
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_222_1120",
      "selected slot should carry from selection into confirmation",
    );
    assertCondition(
      (await stage.getAttribute("data-manage-exposure")) === "hidden",
      "manage exposure must stay hidden in review posture",
    );

    await page.getByTestId("booking-confirmation-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-confirmation-stage']");
      return stage?.getAttribute("data-confirmation-truth") === "booking_in_progress";
    });
    assertCondition(
      await page.getByTestId("booking-in-progress-state").isVisible(),
      "booking in progress child state should render after confirm",
    );
    assertCondition(
      await page.getByTestId("booking-confirmation-primary-action").isDisabled(),
      "primary action should block duplicate taps in progress posture",
    );

    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-confirmation-stage']");
      return stage?.getAttribute("data-confirmation-truth") === "confirmation_pending";
    });
    assertCondition(
      await page.getByTestId("confirmation-pending-state").isVisible(),
      "pending confirmation child state should replace in-progress posture",
    );
    assertCondition(
      (await stage.getAttribute("data-artifact-exposure")) === "summary_only",
      "pending posture should keep artifact exposure summary-only",
    );

    await page.reload({ waitUntil: "load" });
    await stage.waitFor();
    assertCondition(
      (await stage.getAttribute("data-confirmation-truth")) === "confirmation_pending",
      "pending confirmation should restore after refresh",
    );
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_222_1120",
      "selected slot provenance should survive refresh",
    );

    await page.getByTestId("booking-confirmation-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-confirmation-stage']");
      return stage?.getAttribute("data-confirmation-truth") === "confirmed";
    });
    assertCondition(
      await page.getByTestId("booked-summary-child-state").isVisible(),
      "confirmed summary should render after pending settles",
    );
    assertCondition(
      (await stage.getAttribute("data-manage-exposure")) === "writable",
      "confirmed posture should unlock manage exposure",
    );
    assertCondition(
      (await stage.getAttribute("data-artifact-exposure")) === "handoff_ready",
      "confirmed posture should unlock artifact exposure",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await stage.getAttribute("data-confirmation-truth")) === "reconciliation_required",
      "reconciliation route should expose recovery truth",
    );
    assertCondition(
      (await stage.getAttribute("data-manage-exposure")) === "hidden",
      "reconciliation route must not unlock manage exposure",
    );
    assertCondition(
      await page.getByTestId("reconciliation-recovery-state").isVisible(),
      "recovery state should stay in the same shell",
    );

    assertCondition(
      externalRequests.size === 0,
      `confirmation flow should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("296-confirmation-pending-disputed-recovery-trace.zip"),
    });
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
