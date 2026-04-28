# 323 Urgent Return Callback And Loop Prevention Rules

## Clinical safety posture

`par_323` treats no-slot outcomes as direct-care safety events, not convenience workflow changes. The backend fails closed on:

- callback selected without a current expectation envelope
- return-to-practice selected without durable downstream reopen linkage
- stale offer shells that remain mutable after fallback supersedes them
- repeated hub-practice recirculation with no meaningful novelty

## Mandatory controls

### Lead-time law is non-overrideable

Coordinators may not force:

- alternatives when `offerLeadMinutes` exceeds the remaining clinical window
- callback when `callbackLeadMinutes` exceeds the remaining clinical window

If the declared lead-time model says the path is too slow, the engine must move to explicit return posture.

### Callback truth must be governed

`callback_transfer_pending` is the only legal interim callback state. Patient-safe callback posture exists only after both of these are current:

- `CallbackCase`
- `CallbackExpectationEnvelope`

Any missing or stale linkage is an exception condition, not a soft warning.

### Return-to-practice must respect lineage

The hub may not directly rewrite parent-practice request state. Return-to-practice is legal only through governed reopen linkage that returns downstream workflow, lineage, and lease refs.

### Provenance is preserved, not erased

If a live offer session existed, `AlternativeOfferSession` and `AlternativeOfferFallbackCard` are preserved as `read_only_provenance`. This blocks unsafe stale accept paths while keeping prior patient or coordinator context auditable.

### Ping-pong is blocked

`bounceCount` and `noveltyScore` are persisted. If the case keeps recirculating without meaningful improvement, the engine raises supervisor review rather than silently returning the case to ordinary flow.

## Waitlist carry-forward

When Phase 4 waitlist continuation evidence already established that local waiting is unsafe, the hub fallback record binds:

- `WaitlistDeadlineEvaluation`
- `WaitlistFallbackObligation`
- `WaitlistContinuationTruthProjection`

The hub may inspect newer evidence, but it may not quietly reframe the case as ordinary low-risk waiting from stale pre-fallback posture.

## Operational seam

The current live reopen integration is still a typed seam via `Phase5PracticeReopenBridge`. The risk is explicitly recorded in `PHASE5_BATCH_316_323_INTERFACE_GAP_FALLBACK_REOPEN_LIFECYCLE_COORDINATOR.json`, so later lifecycle work must replace the adapter without weakening the existing fail-closed controls.
