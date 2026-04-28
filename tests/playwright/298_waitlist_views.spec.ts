import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientWaitlistViewsCoverage = [
  "no-supply selection can open the join waitlist route in the same shell",
  "joining settles into a waiting manage state without losing preference context",
  "actionable waitlist offers accept into pending while keeping the offer card pinned",
  "expired and superseded offers stay visible as provenance with the next action made explicit",
  "fallback due and overdue states switch the dominant action away from waiting",
  "contact-route repair morph preserves the blocked offer context until repair resolves",
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

    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const waitlistStage = page.getByTestId("patient-waitlist-stage");
    const offerCard = page.getByTestId("active-waitlist-offer-card");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_no_supply/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("booking-open-waitlist").click();
    await page.waitForURL(/\/bookings\/booking_case_295_no_supply\/waitlist\?/);
    await waitlistStage.waitFor();
    assertCondition((await routeRoot.getAttribute("data-route-key")) === "waitlist", "waitlist route marker drifted");
    assertCondition(
      (await waitlistStage.getAttribute("data-waitlist-state")) === "join_sheet",
      "join sheet state marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-continuation-truth")) === "pre_join",
      "join sheet continuation truth drifted",
    );
    assertCondition(
      await page.getByTestId("join-waitlist-sheet").isVisible(),
      "join waitlist sheet should render from the no-supply handoff",
    );
    await page.getByTestId("waitlist-sticky-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-waitlist-state") === "manage_status" &&
        stage?.getAttribute("data-continuation-truth") === "waiting_for_offer"
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-manage-view").isVisible(),
      "joined waitlist should widen into the manage status view",
    );
    assertCondition(
      await page.getByTestId("waitlist-preference-summary").isVisible(),
      "preference summary should remain visible after joining",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-waitlist-state")) === "offer_actionable",
      "actionable offer state marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "nonexclusive reservation truth marker drifted",
    );
    assertCondition(
      (await offerCard.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "offer card should expose truthful nonexclusive posture",
    );
    await page.getByTestId("waitlist-sticky-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-waitlist-state") === "accepted_pending" &&
        stage?.getAttribute("data-reservation-truth") === "pending_confirmation"
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-offer-accept-view").isVisible(),
      "accepted pending view should render after offer acceptance",
    );
    assertCondition(
      await offerCard.isVisible(),
      "accepted pending state should keep the active offer card pinned",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-offer-expiry-mode")) === "expired",
      "expired offer marker drifted",
    );
    assertCondition(
      await page.getByTestId("expiry-or-supersession-provenance-card").isVisible(),
      "expired offer should remain visible as provenance",
    );
    await page.locator("[data-action-ref='keep_waitlist_active']").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return stage?.getAttribute("data-waitlist-state") === "manage_status";
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_superseded/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-offer-expiry-mode")) === "superseded",
      "superseded offer marker drifted",
    );
    await page.locator("[data-action-ref='open_newer_offer']").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-waitlist-state") === "offer_actionable" &&
        stage?.getAttribute("data-reservation-truth") === "truthful_nonexclusive"
      );
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-window-risk-state")) === "fallback_due",
      "fallback due marker drifted",
    );
    assertCondition(
      await page.getByTestId("waitlist-fallback-panel").isVisible(),
      "fallback due state should render the fallback panel",
    );
    await page.getByTestId("waitlist-sticky-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-window-risk-state") === "overdue" &&
        stage?.getAttribute("data-fallback-route") === "callback"
      );
    });
    assertCondition(
      (await waitlistStage.getAttribute("data-continuation-truth")) === "callback_expected",
      "overdue fallback should switch the visible continuation away from waiting",
    );
    assertCondition(
      (await page.locator("[data-action-ref='accept_waitlist_offer']").count()) === 0,
      "overdue fallback must not leave offer acceptance visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_contact_repair/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-reachability-state")) === "repair_required",
      "contact repair reachability marker drifted",
    );
    assertCondition(
      await page.getByTestId("waitlist-contact-repair-morph").isVisible(),
      "contact repair morph should render when reachability is blocked",
    );
    assertCondition(
      await offerCard.isVisible(),
      "contact repair should preserve the blocked offer card in place",
    );
    await page.getByTestId("waitlist-sticky-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-reachability-state") === "current" &&
        stage?.getAttribute("data-waitlist-state") === "offer_actionable"
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-offer-accept-view").isVisible(),
      "resolved repair should return to the actionable offer view",
    );

    assertCondition(
      externalRequests.size === 0,
      `waitlist views should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({ path: outputPath("298-waitlist-views-trace.zip") });
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
