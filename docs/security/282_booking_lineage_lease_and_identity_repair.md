# 282 Booking Lineage Lease And Identity Repair

## Guardrail summary

The booking kernel is allowed to settle booking-branch truth only. It is not allowed to settle capability truth, slot truth, confirmation truth, or canonical request closure.

## Lease and epoch enforcement

Every live mutation re-validates:

- `sourceDecisionEpochRef`
- `sourceDecisionSupersessionRef`
- `requestLifecycleLeaseRef`
- `ownershipEpoch`
- `fencingToken`
- `currentLineageFenceEpoch`
- `lineageCaseLinkRef`

If any of those drift, the branch does not continue optimistically. The mutation is rejected and the append-only journal records the failure code.

This keeps stale tabs, stale workers, and stale takeovers from rewriting booking state after the request lease has moved on.

## Wrong-patient and identity repair

Wrong-patient correction preserves summary provenance only. The booking branch never keeps mutating once identity correction or repair has frozen the lineage.

If `identityRepairBranchDispositionRef` is not released:

- live booking mutation fails closed
- no search/open/commit/manage transition is applied
- the case remains in governed recovery posture until identity repair releases it

The kernel therefore treats identity repair as a higher-order safety fence, not as advisory metadata.

## Publication and recovery posture

`routeFreezeDispositionRef` and `releaseRecoveryDispositionRef` remain orthogonal refs on the case tuple.

- they are not collapsed into `BookingCase.status`
- they suppress live mutation when present
- they preserve patient and staff continuity refs without pretending the booking branch is calm

## Request closure

There is no booking-local closure authority.

`BookingCase.closureAuthority` is hard-pinned to `LifecycleCoordinator`. Closing a booking branch is not the same thing as closing the canonical request.

## PHI posture

Transition audit and public event payloads remain PHI-safe:

- no raw phone numbers
- no free-text transcripts
- no raw supplier payload copies
- no patient-facing prose copied into public booking events

Only opaque refs, machine-readable codes, and minimal lifecycle descriptors are recorded on transition surfaces.
