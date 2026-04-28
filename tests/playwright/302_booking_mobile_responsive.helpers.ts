import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  openBookingRoute,
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
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};

export const BOOKING_RESPONSIVE_ATLAS_PATH = "/docs/frontend/302_booking_mobile_responsive_atlas.html";

export const BOOKING_RESPONSIVE_FIXTURE_URLS = {
  workspace:
    "/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments",
  selection:
    "/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments",
  confirmation:
    "/bookings/booking_case_296_review/confirm?origin=appointments&returnRoute=/appointments",
  manage:
    "/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments",
  waitlist:
    "/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments",
  embeddedConfirmation:
    "/bookings/booking_case_296_review/confirm?origin=appointments&returnRoute=/appointments&host=nhs_app&safeArea=bottom",
  embeddedManage:
    "/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments&host=nhs_app&safeArea=bottom",
  embeddedWaitlist:
    "/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments&host=nhs_app&safeArea=bottom",
} as const;

export type BookingResponsiveFixtureKey = keyof typeof BOOKING_RESPONSIVE_FIXTURE_URLS;

export function bookingResponsiveUrl(baseUrl: string, fixture: BookingResponsiveFixtureKey): string {
  return `${baseUrl}${BOOKING_RESPONSIVE_FIXTURE_URLS[fixture]}`;
}

export async function startResponsiveAtlasServer() {
  return startStaticServer(BOOKING_RESPONSIVE_ATLAS_PATH);
}

export async function readRootResponsiveMarkers(page: any) {
  const root = page.getByTestId("Patient_Booking_Workspace_Route");
  await root.waitFor();
  return {
    breakpointClass: await root.getAttribute("data-breakpoint-class"),
    missionStackState: await root.getAttribute("data-mission-stack-state"),
    safeAreaClass: await root.getAttribute("data-safe-area-class"),
    stickyActionPosture: await root.getAttribute("data-sticky-action-posture"),
    embeddedMode: await root.getAttribute("data-embedded-mode"),
    responsiveTaskId: await root.getAttribute("data-responsive-task-id"),
    motionProfile: await root.getAttribute("data-motion-profile"),
    routeKey: await root.getAttribute("data-route-key"),
  };
}

export async function assertFocusableVisible(page: any, locator: any, reservePx = 132): Promise<void> {
  await locator.focus();
  await page.waitForTimeout(220);
  const visible = await locator.evaluate(
    (node: HTMLElement, reserve: number) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight - reserve + 24;
    },
    reservePx,
  );
  assertCondition(visible, "focused control should remain visible above the sticky tray reserve");
}
