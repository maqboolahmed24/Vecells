# 288 Manage Gate, Continuity, and Safety Preemption

## Gate requirements

Every cancel, reschedule, abandon, and detail-update mutation must bind:

- route-intent tuple
- governing appointment version
- capability tuple
- provider binding hash
- publication/runtime tuple
- continuity evidence reference
- current case fence epoch

If any of those drift, the result is recovery-oriented and fail-closed. Legacy pages and cached forms do not keep write authority.

## Manage truth boundary

Routine manage posture is writable only when confirmation truth is still confirmed and the current manage exposure is writable. Pending, failed, reconciliatory, or superseded appointment truth downgrades manage posture in place.

## No early release

Cancellation does not release capacity or create calm cancellation copy on local acceptance. The source appointment remains:

- `cancellation_pending` while supplier truth is unresolved
- `cancelled` only after authoritative truth exists

This is the specific closure for the “cancel releases slot immediately” gap.

## Reschedule lineage safety

Reschedule is not allowed to branch into a separate scheduler. The original appointment stays authoritative until the replacement is either:

- confirmed and linked as the superseding appointment, or
- abandoned or failed and safely restored

This preserves monotone lineage and keeps replacement failure from silently orphaning the source booking.

## Clinical safety preemption

Administrative detail update does not accept symptom change, deterioration, or other clinically meaningful free text as an ordinary appointment edit. When such text is detected:

- no appointment mutation is written
- `BookingManageSettlement.result = safety_preempted`
- the shell stays anchored to the appointment
- recovery routes into governed request and safety handling

This prevents admin flows from widening into ungoverned clinical handling.

## Contact-route dependency repair

When a contact-dependent manage action is blocked by reachability or route repair:

- ordinary manage posture is suspended
- `ContactRouteRepairJourney` is created or refreshed
- the appointment anchor stays pinned
- continuity remains explicit rather than redirecting to a generic failure page

## Artifact governance

Appointment summaries, attendance instructions, exports, and browser handoff surfaces remain governed by `AppointmentPresentationArtifact`. Local manage success does not grant richer artifact visibility than the current artifact contract allows.
