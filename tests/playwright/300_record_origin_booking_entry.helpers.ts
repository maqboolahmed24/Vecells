import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};

export const BOOKING_ENTRY_ROUTE_SELECTOR =
  "[data-testid='Patient_Record_Origin_Booking_Entry_Route']";
export const BOOKING_ENTRY_ATLAS_PATH =
  "/docs/frontend/300_record_origin_booking_entry_atlas.html";

export const BOOKING_ENTRY_FIXTURE_IDS = {
  homeReady: "booking_entry_300_home_ready",
  requestsReady: "booking_entry_300_requests_ready",
  appointmentsReady: "booking_entry_300_appointments_ready",
  appointmentsReadOnly: "booking_entry_300_appointments_read_only",
  recordOriginReady: "booking_entry_300_record_origin_ready",
  recordOriginRecovery: "booking_entry_300_record_origin_recovery",
} as const;

export function bookingEntryUrl(baseUrl: string, fixtureId: string): string {
  return `${baseUrl}/bookings/entry/${fixtureId}`;
}

export async function openBookingEntryRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.locator(BOOKING_ENTRY_ROUTE_SELECTOR).waitFor();
}

export async function waitForBookingEntryPath(page: any, fixtureId: string): Promise<void> {
  await page.waitForURL(new RegExp(`/bookings/entry/${fixtureId}$`));
  await page.locator(BOOKING_ENTRY_ROUTE_SELECTOR).waitFor();
}

export async function readReturnBinder(page: any): Promise<Record<string, string | null>> {
  const binder = page.locator("[data-testid='booking-entry-return-binder']");
  await binder.waitFor({ state: "attached" });
  return await binder.evaluate((node) => ({
    returnRouteRef: node.getAttribute("data-return-route-ref"),
    selectedAnchorRef: node.getAttribute("data-selected-anchor-ref"),
    selectedAnchorLabel: node.getAttribute("data-selected-anchor-label"),
    continuityTupleHash: node.getAttribute("data-continuity-tuple-hash"),
    navReturnContractRef: node.getAttribute("data-nav-return-contract-ref"),
    requestReturnBundleRef: node.getAttribute("data-request-return-bundle-ref"),
    recordOriginContinuationRef: node.getAttribute("data-record-origin-continuation-ref"),
    recoveryContinuationTokenRef: node.getAttribute("data-recovery-continuation-token-ref"),
  }));
}

export async function activeElementSummary(page: any): Promise<{
  tag: string | null;
  testId: string | null;
}> {
  return await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      tag: active?.tagName ?? null,
      testId: active?.getAttribute("data-testid") ?? null,
    };
  });
}
