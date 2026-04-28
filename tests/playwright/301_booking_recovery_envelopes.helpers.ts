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

export const BOOKING_RECOVERY_ATLAS_PATH = "/docs/frontend/301_booking_recovery_envelopes_atlas.html";

export const BOOKING_RECOVERY_FIXTURE_URLS = {
  workspaceRecovery:
    "/bookings/booking_case_293_recovery?origin=appointments&returnRoute=/appointments",
  selectionStale:
    "/bookings/booking_case_295_stale/select?origin=appointments&returnRoute=/appointments",
  confirmationDisputed:
    "/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments",
  confirmationIdentityHold:
    "/bookings/booking_case_296_identity_repair/confirm?origin=appointments&returnRoute=/appointments",
  manageReminderBlocked:
    "/bookings/booking_case_297_reminder_blocked/manage?origin=appointments&returnRoute=/appointments",
  waitlistExpired:
    "/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments",
  waitlistContactRepair:
    "/bookings/booking_case_298_contact_repair/waitlist?origin=appointments&returnRoute=/appointments",
  waitlistContactRepairSecure:
    "/bookings/booking_case_298_contact_repair_secure/waitlist?origin=secure_link&returnRoute=/recovery/secure-link",
} as const;

export type BookingRecoveryFixtureKey = keyof typeof BOOKING_RECOVERY_FIXTURE_URLS;

export function bookingRecoveryUrl(baseUrl: string, fixture: BookingRecoveryFixtureKey): string {
  return `${baseUrl}${BOOKING_RECOVERY_FIXTURE_URLS[fixture]}`;
}

export async function startRecoveryAtlasServer() {
  return startStaticServer(BOOKING_RECOVERY_ATLAS_PATH);
}

export async function readRecoveryMarkers(page: any) {
  const shell = page.getByTestId("BookingRecoveryShell");
  await shell.waitFor();
  return {
    reason: await shell.getAttribute("data-recovery-reason"),
    summaryTier: await shell.getAttribute("data-summary-tier"),
    identityHoldState: await shell.getAttribute("data-identity-hold-state"),
    nextSafeAction: await shell.getAttribute("data-next-safe-action"),
    reentryRouteFamily: await shell.getAttribute("data-reentry-route-family"),
    channelMode: await shell.getAttribute("data-channel-mode"),
    tupleHash: await shell.getAttribute("data-recovery-tuple-hash"),
    tone: await shell.getAttribute("data-tone"),
  };
}
