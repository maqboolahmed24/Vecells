import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

const ROOT_SELECTOR = "[data-testid='Patient_Booking_Workspace_Route']";

function secureLinkUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl}${pathname}?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link`;
}

async function readReturnBinder(page: any): Promise<Record<string, string | null>> {
  const binder = page.locator("[data-testid='booking-return-contract-binder']");
  await binder.waitFor({ state: "attached" });
  return await binder.evaluate((node: HTMLElement) => ({
    returnRouteRef: node.getAttribute("data-return-route-ref"),
    selectedAnchorRef: node.getAttribute("data-selected-anchor-ref"),
    shellContinuityKey: node.getAttribute("data-shell-continuity-key"),
  }));
}

export const bookingNotificationEntryCoverage = [
  "secure-link handoff entry stays inside the patient booking shell with an explicit notification banner",
  "pending confirmation secure-link entry remains non-booked and exposes confirmation truth markers",
  "reopened secure-link entry stays same-shell and lands inside recovery posture",
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

    const root = page.locator(ROOT_SELECTOR);
    const banner = page.getByTestId("booking-notification-entry-banner");

    await openBookingRoute(page, secureLinkUrl(baseUrl, "/bookings/booking_case_306_handoff_live"));
    assertCondition(
      (await root.getAttribute("data-origin-key")) === "secure_link",
      "handoff entry should keep secure_link origin",
    );
    assertCondition(
      (await root.getAttribute("data-notification-state")) === "handoff_active",
      "handoff entry should expose handoff_active notification state",
    );
    assertCondition(
      (await root.getAttribute("data-route-key")) === "workspace",
      "handoff entry should stay on the workspace route",
    );
    assertCondition(
      (await banner.getAttribute("data-notification-state")) === "handoff_active",
      "handoff entry banner should match the route notification state",
    );
    assertCondition(
      ((await banner.textContent()) ?? "").toLowerCase().includes("same booking shell"),
      "handoff entry banner should explain same-shell secure-link re-entry",
    );
    const handoffBinder = await readReturnBinder(page);
    assertCondition(
      handoffBinder.returnRouteRef === "/recovery/secure-link",
      `handoff secure-link return route drifted: ${handoffBinder.returnRouteRef}`,
    );

    await openBookingRoute(
      page,
      secureLinkUrl(baseUrl, "/bookings/booking_case_306_confirmation_pending/confirm"),
    );
    assertCondition(
      (await root.getAttribute("data-notification-state")) === "confirmation_pending",
      "pending entry should expose confirmation_pending notification state",
    );
    assertCondition(
      (await page.getByTestId("booking-confirmation-stage").getAttribute("data-confirmation-truth")) ===
        "confirmation_pending",
      "pending entry should keep confirmation truth pending",
    );
    assertCondition(
      ((await root.textContent()) ?? "").toLowerCase().includes("your booking is confirmed") === false,
      "pending secure-link entry must not imply a confirmed booking",
    );

    await openBookingRoute(page, secureLinkUrl(baseUrl, "/bookings/booking_case_306_reopened"));
    assertCondition(
      (await root.getAttribute("data-notification-state")) === "reopened",
      "reopened entry should expose reopened notification state",
    );
    await page.getByTestId("BookingRecoveryShell").waitFor();
    assertCondition(
      (await banner.getAttribute("data-notification-state")) === "reopened",
      "reopened entry banner should stay aligned with recovery posture",
    );

    await assertNoHorizontalOverflow(page, "306 booking notification entry desktop");
    assertCondition(
      externalRequests.size === 0,
      `306 patient notification entry should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("306-booking-notification-entry-trace.zip"),
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
