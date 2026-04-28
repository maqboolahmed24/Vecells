export const PATIENT_BOOKING_ENTRY_IDS = {
  homeReady: "booking_entry_300_home_ready",
  requestsReady: "booking_entry_300_requests_ready",
  appointmentsReady: "booking_entry_300_appointments_ready",
  appointmentsReadOnly: "booking_entry_300_appointments_read_only",
  recordOriginReady: "booking_entry_300_record_origin_ready",
  recordOriginRecovery: "booking_entry_300_record_origin_recovery",
} as const;

export type PatientBookingEntryFixtureId =
  (typeof PATIENT_BOOKING_ENTRY_IDS)[keyof typeof PATIENT_BOOKING_ENTRY_IDS];

export function bookingEntryPath(
  fixtureId: PatientBookingEntryFixtureId,
): `/bookings/entry/${string}` {
  return `/bookings/entry/${fixtureId}`;
}
