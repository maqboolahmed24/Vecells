# 291 Staff Assisted Booking API

`AssistedBookingSession` is the canonical staff-side booking shell for one `BookingCase`.
It does not create a second booking engine.
It stores the current booking-core refs, the lawful capability tuple, the workspace fence refs, the current publication/runtime tuple, and the current task-completion envelope ref in one durable record.

## Core Model

`AssistedBookingSession` persists:

- booking case id, task ref, workspace ref, and staff actor ref
- current mode and session state
- current slot snapshot, offer session, reservation scope, and selected slot refs
- capability resolution ref, capability projection ref, provider binding ref, provider binding hash, adapter contract profile ref, and capability tuple hash
- staff workspace consistency projection ref, workspace slice trust projection ref, review-action lease ref, and focus/work-protection refs
- surface route contract ref, surface publication ref, runtime publication bundle ref, and task-completion settlement-envelope ref
- request lifecycle lease ref, request ownership epoch ref, stale-owner recovery ref, and blocked reason refs

`BookingExceptionQueue` is one explicit projection for manual attention booking failures.
It stores machine-readable family, severity, state, anchor refs, booking/session refs, current capability and publication refs, request lease data, evidence refs, and same-shell recovery route refs.

## Command Surface

The command layer exposes one truthful API family:

- query the current assisted workspace bundle
- start or refresh an assisted session
- refresh lawful staff capability resolution
- start staff-assisted slot search through the canonical search and offer pipeline
- compare, select, and confirm assistable slots through the same offer, reservation, and commit machinery
- initiate waitlist or governed fallback
- refresh, query, claim, and reopen exception-queue work
- reacquire stale-owner booking work without bypassing task or publication law

`resolveLawfulStaffCapability` keeps staff actionability on the same supplier, provider binding, and capability tuple lineage.
If the binding or supplier drifts, the application throws instead of silently widening scope.

## Queue Projection

`BookingExceptionQueue` currently projects:

- `supplier_endpoint_unavailable`
- `slot_revalidation_failure`
- `ambiguous_commit`
- `patient_self_service_blocked`
- `capability_mismatch`
- `linkage_required_blocker`
- `reminder_delivery_failure`
- `stale_owner_or_publication_drift`

`synchronizeExceptionQueue` recomputes queue truth from current capability posture, commit posture, reminder posture, stale-owner state, and workspace trust.
Entries resolve only when the underlying authoritative condition clears.

## Booking-Core Reuse

Staff-assisted search, ranking, selection, reservation, commit, waitlist, and fallback all run through the existing Phase 4 booking core:

- `Phase4SlotSearchApplication`
- `Phase4CapacityRankApplication`
- `Phase4BookingReservationApplication`
- `Phase4BookingCommitApplication`
- `Phase4SmartWaitlistApplication`
- `Phase4BookingReminderApplication`

The assisted API only wraps those engines with workspace, lease, and recovery law.

## Settlement Law

`TaskCompletionSettlementEnvelope` remains authoritative for task closure and next-task launch.
Local staff acknowledgement does not close booking work.
The assisted workspace bundle returns `taskCompletionGate` so downstream staff UI can render blocked posture honestly until authoritative settlement or governed recovery exists.
