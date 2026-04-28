# 300 Algorithm Alignment Notes

## Governing sources

- `PatientNavReturnContract` governs same-shell return for home and appointment-origin entry.
- `PatientRequestReturnBundle` governs request-detail entry and remains visible inside the adapter.
- `RecordActionContextToken`, `RecordOriginContinuationEnvelope`, and `RecoveryContinuationToken` govern record-origin entry.
- `PatientBookingEntryProjectionAdapter` exists because the repository does not yet expose one unified booking-entry projection.
- `PatientAppointmentWorkspaceProjection293` remains the booking-workspace preview source after entry continuity is validated.

## Scenario mapping

| Scenario | Governing source objects | Writable? | Why |
| --- | --- | --- | --- |
| `booking_entry_300_home_ready` | `PatientPortalEntryProjection`, `PatientNavReturnContract`, home compact panel source refs | yes | home-origin return contract and panel anchor are aligned |
| `booking_entry_300_requests_ready` | `PatientRequestDetailProjection`, `PatientRequestReturnBundle`, request lineage | yes | request detail still owns the next safe booking action |
| `booking_entry_300_appointments_ready` | patient appointments continuity snapshot, current itinerary anchor, booking workspace preview | yes | itinerary anchor and return posture still match |
| `booking_entry_300_appointments_read_only` | same as above, but continuity tuple drifted | no, read-only | summary is still safe but live booking would overclaim |
| `booking_entry_300_record_origin_ready` | `PatientRecordFollowUpEligibilityProjection`, `RecordActionContextToken`, `RecordOriginContinuationEnvelope`, `RecoveryContinuationToken` | yes | record follow-up eligibility and continuation fence are aligned |
| `booking_entry_300_record_origin_recovery` | same as above, but step-up and release posture drifted | no, recovery-only | entry must preserve the record anchor and suppress stale controls |

## Adapter law

- The adapter composes authoritative objects from home or requests, records, appointment continuity, and booking workspace preview.
- The adapter does not own booking truth, return truth, or record visibility truth.
- The adapter only exposes one continuity tuple used by the entry route and the hidden return binder.
