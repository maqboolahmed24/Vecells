# 280 Phase 4 reservation truth, revalidation, and manage guardrails

This pack closes the Phase 4 booking truth gaps that are most likely to create false confidence or unsafe writable posture.

## Guardrails

1. Search and commit do not talk to live supplier lists directly.
   - Search resolves to `SlotSetSnapshot`.
   - Commit reuses `SnapshotSelectable(q,t)` and `RevalidationPass(tx,t)`.

2. Selected does not mean held.
   - `OfferSession.expiresAt` is interaction TTL only.
   - reserved wording and hold countdowns may render only from the current `ReservationTruthProjection`.

3. Accepted-for-processing is never equivalent to booked.
   - `BookingTransaction` separates `localAckState`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState`.
   - `BookingConfirmationTruthProjection` is the sole authority for patient or staff booked reassurance.

4. Pending and disputed confirmation are not calm.
   - `confirmation_pending` and `reconciliation_required` are first-class same-shell states.
   - manage, artifact, and reminder exposure remain hidden or summary-only until confirmed.

5. Manage exposure is capability- and continuity-bound.
   - `RouteWritable(tx,t)` binds route publication, runtime publication, shell consistency, and embedded-session validity.
   - `BookingContinuityEvidenceProjection.validationState` must remain `trusted` before writable manage posture stays live.

6. Waitlist and fallback semantics are typed now.
   - `WaitlistFallbackObligation.requiredFallbackRoute` is the authority for no-supply and failed-commit continuation.

## Required exact formulas

- `SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef matches the active BookingCase version] * 1[q.policyBundleHash matches the active compiled policy bundle] * 1[q.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * 1[q.capabilityTupleHash matches the current BookingCapabilityResolution.capabilityTupleHash] * 1[q.coverageState in {complete, partial_coverage}] * 1[recoveryState(q).viewState != stale_refresh_required]`
- `RevalidationPass(tx,t) = SnapshotSelectable(SlotSetSnapshot(tx.snapshotId),t) * 1[tx.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * LiveSupplierBookable(tx.selectedSlotRef,t) * PolicySatisfied(tx.selectedSlotRef, tx.policyBundleHash) * RouteWritable(tx,t) * VersionFresh(tx.preflightVersion, tx.selectedSlotRef, t)`
- `RouteWritable(tx,t) = 1[AudienceSurfaceRouteContract live and surface publication current and RuntimePublicationBundle live and PatientShellConsistencyProjection valid and, when embedded, PatientEmbeddedSessionProjection valid]`
- `Cancelable(a,t) = 1[a.status = booked and startAt(a) - t >= cancelCutoff(a) and no live AppointmentManageCommand fence exists for a]`
- `Reschedulable(a,t) = 1[a.status = booked and startAt(a) - t >= amendCutoff(a) and no live AppointmentManageCommand fence exists for a]`

## Recovery posture

The same shell must preserve the last safe slot, appointment, or selection anchor whenever truth becomes stale, blocked, pending, or recovery-only. The system may not widen calmness by using toasts, detached appointment rows, reminder-plan existence, or route-local booleans.
