# 321 Hub Commit Attempts, Confirmation Gates, And Appointment Truth

`par_321` turns hub booking commit into an authoritative backend flow instead of treating supplier success as an optimistic side effect.

## Authoritative runtime

The canonical implementation is [phase5-hub-commit-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-hub-commit-engine.ts).

It composes four already-frozen authorities:

1. `315` case ownership and transition law
2. `317` policy evaluation for `commit_attempt` and `practice_visibility_generation`
3. `318` candidate, trust, and adapter-binding truth
4. Phase 0 `CapacityReservation` and `ExternalConfirmationGate`

This layer is the only owner of:

- `HubActionRecord`
- `HubCommitAttempt`
- `HubBookingEvidenceBundle`
- `HubAppointmentRecord`
- `HubCommitSettlement`
- `HubContinuityEvidenceProjection`
- `HubCommitReconciliationRecord`
- `HubSupplierMirrorState`
- `HubSupplierDriftHook`

## Commit law

Every attempt binds:

- selected candidate ref
- capacity unit ref
- reservation ref and reservation fence token
- provider adapter binding ref and binding hash
- current truth tuple hash
- current policy tuple hash
- current lineage fence epoch
- current idempotency key

If those inputs drift before side effects, the commit fails closed as `stale_candidate`.

The service supports three distinct modes and does not collapse them:

- `native_api`
- `manual_pending_confirmation`
- `imported_confirmation`

## Confirmation gate and booked truth

`321` uses the canonical Phase 0 `ExternalConfirmationGate` for all three modes.

The commit layer now persists the gate-derived posture alongside the hub truth projection:

- `native_booking_pending`
- `confirmation_pending`
- `confirmed_pending_practice_ack`
- `disputed`
- `expired`
- `blocked_by_drift`

Booked truth is created only when:

1. the gate reaches `confirmed`
2. the current truth tuple still matches the selected candidate
3. the provider binding remains the same
4. reservation truth can be confirmed safely

Only then does the service:

- create or update `HubAppointmentRecord`
- confirm the reservation
- move the case to `booked_pending_practice_ack`
- move `HubOfferToConfirmationTruthProjection.confirmationTruthState` to `confirmed_pending_practice_ack`
- emit `HubCommitSettlement.result = booked_pending_ack`

## Degraded evidence paths

Manual and imported evidence are intentionally weaker than native authoritative confirmation.

`manual_pending_confirmation`:

- captures a structured `HubBookingEvidenceBundle`
- keeps the case provisional until enough independent evidence families clear the gate
- never mints booked truth from a single weak operator note

`imported_confirmation`:

- correlates source version, selected candidate, supplier booking ref, and duplicate-booking conflicts
- disputes weak or mismatched imports instead of silently upgrading truth
- supports auto-begin when a valid attempt does not already exist

## Split-brain and drift handling

Timeout-unknown or uncertain supplier outcomes write a durable reconciliation row instead of retrying directly into a possible double booking.

Once authoritative confirmation exists, the commit layer immediately starts supplier mirror monitoring.

Observed supplier cancellation or reschedule now:

- creates a typed `HubSupplierDriftHook`
- freezes manage posture
- moves confirmation truth to `blocked_by_drift`
- preserves the case as explicitly unresolved for `322` and `323`

Those later tracks must consume these hooks; they may not invent a second booking truth.
