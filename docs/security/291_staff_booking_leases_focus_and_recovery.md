# 291 Staff Booking Leases, Focus, and Recovery

Staff assistance is not exempt from booking law.
Every assisted mutation stays bound to current workspace, lease, and publication truth before the booking core is allowed to move.

## Required Fences

Every assisted select, confirm, waitlist, fallback, or recovery mutation requires the current:

- `StaffWorkspaceConsistencyProjection`
- `WorkspaceSliceTrustProjection`
- `ReviewActionLease`
- booking-case request lifecycle lease
- booking-case ownership epoch
- surface publication ref
- runtime publication bundle ref

If any one of those tuples drifts, the mutation fails closed and the session moves to `stale_recoverable`.

## Focus Protection

When staff are comparing slots or working a recovery action, `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` protect the active comparison or recovery shell.
Queue refreshes may update surrounding posture, but they must not silently replace the selected compare anchors or the live recovery form.

The implementation keeps compatibility with both `focusProtectionLeaseRef` and the legacy-compatible `workProtectionLeaseRef`.

## Same-Shell Recovery

`failClosedWithRecovery` performs best-effort stale-owner opening and then writes one explicit queue entry in `BookingExceptionQueue`.
The dominant operator recovery family is `stale_owner_or_publication_drift`.
This keeps recovery visible in the same staff shell instead of degrading to local notes or logs.

`reacquireAssistedBookingTask` is the governed path back from stale-owner posture.
It reacquires the task lease, refreshes the assisted session to the live ownership tuple, and lets queue synchronization clear the recovery entry when the authoritative stale condition is gone.

## Capability and Linkage Boundaries

Lawful capability widening is tuple-bound.
Staff assistance may not:

- switch suppliers silently
- rotate to a different provider binding silently
- invent booking truth outside reservation and confirmation projections
- suppress GP-linkage blockers behind an apparently live self-service path

Linkage-required and reminder-delivery failures are durable machine-readable queue facts, not free-text operational notes.

## Privacy and Diagnostics

Queue evidence and reason refs are machine-readable and replayable.
They should point at ids, tuples, and recovery refs.
They should not carry patient-facing free text or new PHI payloads.
