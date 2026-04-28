# 290 Waitlist Assignment and Fallback

Only authoritative released capacity may enter the matcher. Do not treat embargoed, stale, or merely visible slots as released waitlist supply.

Operational flow:

1. Run `processReleasedCapacity` only from authoritative cancellation/release settlements.
2. Let the matcher read indexed modality, site, local day, and continuity keys before scoring.
3. Issue any chosen pair through `ReservationAuthority`, never by writing a visible waitlist offer without a reservation scope.
4. Keep one active decision-required offer per waitlist entry as the operational ceiling.
5. Expire or supersede the reservation scope with the live fence token before refreshing waitlist posture.

If `offerabilityState` becomes `fallback_required` or `overdue`, stop issuing local offers and transfer through the stored fallback obligation. `refreshFallbackObligation` is the repair path for stale-capacity truth, no-eligible-supply signals, or policy-cutoff drift after a previously safe waitlist entry was created.

Callback and hub escalation are not advisory labels. Once a live entry rotates into callback or hub fallback, treat the linked `callbackCaseRef` or `hubCoordinationCaseRef` as the governing continuation object and stop representing the entry as purely local waitlist supply.

Do not manually recreate a hidden second offer after expiry, supersession, or race loss. The safe operator action is to rerun `processReleasedCapacity` on new authoritative supply or `refreshFallbackObligation` when policy or inventory truth changes.

The waitlist journal is the audit source for why a patient stayed local, received an offer, lost a race, or transferred to callback/hub. Use it together with `WaitlistAllocationBatch.assignmentTupleHash` when investigating fairness or oversell concerns.
