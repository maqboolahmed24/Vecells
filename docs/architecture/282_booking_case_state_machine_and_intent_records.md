# 282 Booking Case State Machine And Intent Records

`par_282` implements the executable Phase 4 booking kernel on top of the contracts frozen in `278` and the owner remap frozen in `281`.

## Scope

This slice owns exactly four durable object families:

- `BookingIntent`
- `BookingCase`
- `SearchPolicy`
- `BookingCaseTransitionJournal`

It does not re-own capability, slot, offer, waitlist, commit, appointment-manage, reminder, or reconciliation semantics. Those later objects stay typed seams and typed refs only.

## Durable lineage

Phase 3 `BookingIntentSnapshot` is normalized into a durable Phase 4 `BookingIntentRecordSnapshot`.

- Phase 3 `seeded` migrates to Phase 4 `proposed`
- case creation acknowledges the intent and moves it to `acknowledged`
- superseded or recovery-only intents cannot open or mutate a live booking branch
- `LifecycleCoordinator` remains the only request-closure authority

LifecycleCoordinator remains the only request-closure authority across the booking branch.

The durable handoff keeps:

- `requestId`
- `requestLineageRef`
- `lineageCaseLinkRef`
- `sourceTriageTaskRef`
- `decisionEpochRef`
- `decisionSupersessionRecordRef`
- `lifecycleLeaseRef`
- `ownershipEpoch`
- `fencingToken`
- `currentLineageFenceEpoch`

## Case truth

`BookingCase.status` implements the frozen 278 vocabulary exactly:

- `handoff_received`
- `capability_checked`
- `searching_local`
- `offers_ready`
- `selecting`
- `revalidating`
- `commit_pending`
- `booked`
- `confirmation_pending`
- `supplier_reconciliation_pending`
- `waitlisted`
- `fallback_to_hub`
- `callback_fallback`
- `booking_failed`
- `managed`
- `closed`

Case state does not stand in for capability state, reservation truth, confirmation truth, waitlist truth, manage exposure, route publication posture, or identity-repair posture.

## Transition enforcement

The kernel rejects any graph edge outside the frozen 278 state machine.

Every mutation validates:

- current `sourceDecisionEpochRef`
- null `sourceDecisionSupersessionRef`
- current `lineageCaseLinkRef`
- current `requestLifecycleLeaseRef`
- current `ownershipEpoch`
- current `fencingToken`
- current `currentLineageFenceEpoch`
- released or null `identityRepairBranchDispositionRef`

If any of those drift, the mutation fails closed and a rejected audit row is appended instead of silently rewriting state.

## SearchPolicy ownership

`SearchPolicy` is recorded when the branch enters `searching_local`.
The kernel stores it durably and binds the case to one `searchPolicyRef`, but the kernel does not infer capability or slot truth from the policy alone.

## Event ownership

The 278 catalog froze a broader booking event vocabulary, but 281 remapped public event ownership. `booking.case.created` is the only public booking event emitted by 282 after the 281 owner remap.

booking.case.created is the only public booking event emitted by 282 after the 281 owner remap.

All later-owned transitions still append immutable journal evidence in 282, but their public canonical events remain owned by later tracks:

- capability: `283`
- slot and offer: `284` and `285`
- commit and appointment creation: `287`
- waitlist and fallback: `290`
- exception queue: `291`
- confirmation convergence: `292`

## Append-only audit

`BookingCaseTransitionJournal` records:

- previous state
- next state
- transition outcome
- failure code when rejected
- actor
- route intent
- command action ref
- command settlement ref
- lineage case link ref
- source decision epoch
- request lease ref
- ownership epoch
- fencing token
- lineage fence epoch
- reason code
- typed dependent ref
- timestamp

Rejected transitions are audited explicitly. Duplicate current writes with the same command action are replayed idempotently without widening truth.

## Parallel seams

Those seams are also published machine-readably in [PHASE4_PARALLEL_INTERFACE_GAP_BOOKING_CASE_KERNEL.json](/Users/test/Code/V/data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_BOOKING_CASE_KERNEL.json).
