# 288 Appointment Manage Command Layer

`288` adds one canonical appointment-manage command layer over the existing Phase 4 booking case, capability, slot, offer, reservation, and commit stack. It does not create a detached manage mini-application.

## Owned objects

- `AppointmentManageCommand`
- `BookingManageSettlement`
- `BookingContinuityEvidenceProjection`

The command layer persists the exact route tuple, governing object version, capability tuple, binding hash, publication tuple, actor mode, and freshness token that were used when the mutation was attempted.

## Governing rules

1. `AppointmentManageCommand` is created before manage outcome is recorded.
2. `BookingManageSettlement` is the authoritative result object for `applied`, `supplier_pending`, `stale_recoverable`, `unsupported_capability`, `safety_preempted`, and `reconciliation_required`.
3. `BookingContinuityEvidenceProjection` keeps the same shell anchored to the appointment lineage, selected anchor, route family, and latest manage settlement.
4. Ordinary manage controls stay writable only while `BookingConfirmationTruthProjection.confirmationTruthState = confirmed`, `manageExposureState = writable`, `BookingCase.status = managed`, and the appointment remains `booked`.

## Cancellation

Cancellation is routed through the same command layer and never releases supply on local intent alone.

- Authoritative cancellation moves the appointment to `cancelled`.
- Supplier uncertainty moves the appointment to `cancellation_pending`.
- `booking.cancelled` is emitted only when authoritative cancellation truth exists.
- Case closure or in-place rebook runs only after authoritative cancellation lands.

This closes the earlier gap where a local cancel click could look calm before supplier truth existed.

## Reschedule

Reschedule is one governed mutation chain over the same engine:

1. source appointment becomes `reschedule_in_progress`
2. booking case returns to `searching_local`
3. slot search, offer compilation, reservation, and commit reuse `284` to `287`
4. source appointment is not freed early
5. once the replacement is authoritative, the source appointment is marked `superseded`
6. the replacement appointment links back through `supersedesAppointmentRef`
7. abandon restores the source appointment and returns the case to `managed`

This closes the earlier gap where reschedule could drift into “cancel plus new search” without lineage.

## Detail update

Detail update remains administrative only.

- field allowance comes from the binding’s `manageSupportContractRef`
- contact-dependent fields can suspend into `ContactRouteRepairJourney`
- clinically meaningful free text does not mutate the appointment
- instead, the result is `safety_preempted` with a governed recovery route

## Continuity

`BookingContinuityEvidenceProjection` is refreshed after every manage command. It binds:

- appointment lineage
- selected anchor
- route family and route tuple
- capability tuple and binding hash
- publication/runtime tuple
- latest manage command and settlement
- experience continuity evidence

Continuity can be `live`, `summary_only`, `stale_recovery`, or `blocked_recovery`. Summary-only and recovery modes are explicit; they are not inferred from local UI state.

## Runtime composition

The command-api wrapper:

- resolves exactly one governing `AppointmentRecord`
- validates stale route tuple, stale capability tuple, stale binding, and stale continuity evidence
- executes the mutation under the same `ScopedMutationGate` law as the rest of the booking stack
- reuses `282` booking-case transitions and `284` to `287` for reschedule and replacement commit
- preserves `AppointmentPresentationArtifact` governance instead of widening artifact access after local manage success

No later reminder, waitlist, or staff-assist track is allowed to fork this state law.
