# 286 Reservation Authority And Truth Projection

`par_286` implements the booking-facing reservation authority on top of the canonical Phase 0 reservation backbone. The runtime surfaces landed in:

- `/Users/test/Code/V/packages/domains/identity_access/src/reservation-queue-control-backbone.ts`
- `/Users/test/Code/V/services/command-api/src/phase4-booking-reservations.ts`
- `/Users/test/Code/V/services/command-api/migrations/135_phase4_booking_reservation_authority.sql`

## What 286 owns

This slice owns one booking-facing orchestration layer over the existing `CapacityReservation`, `ReservationFenceRecord`, and `ReservationTruthProjection` substrate. It adds:

- bounded booking and waitlist reservation scopes
- one current-scope pointer per scope object
- one append-only booking reservation journal
- replay collapse for duplicate command actions
- expiry sweep over the current booking reservation scopes

It does not create a booking-local exclusivity model.

## One serializer per canonical key

All mutations serialize on `canonicalReservationKey`.

The booking wrapper compiles that key from:

- supplier ref
- capacity unit ref
- schedule owner ref
- inventory lineage ref
- slot start and end epoch
- modality
- location ref
- practitioner ref
- service ref

Supplier slot aliases do not get their own lock lane when the canonical identity says they collapse to the same key.

## Lawful state family

`286` uses the frozen reservation state family directly:

- `soft_selected`
- `held`
- `pending_confirmation`
- `confirmed`
- `released`
- `expired`
- `disputed`

`none` remains the absence of a current reservation scope, not a stored reservation row.

## Commit-mode law

The wrapper preserves the canonical commit modes:

- `exclusive_hold`
- `truthful_nonexclusive`
- `degraded_manual_pending`

Real exclusivity is impossible unless the active provider binding says `reservationSemantics = exclusive_hold`.

If the active binding does not allow that mode, booking flows stay truthful and nonexclusive.

## ReservationTruthProjection is the visible authority

The booking wrapper never renders exclusivity from local timers or offer-session TTLs. It reads and refreshes `ReservationTruthProjection`, which carries at minimum:

- `truthState`
- `displayExclusivityState`
- `countdownMode`
- `exclusiveUntil`
- `reservationVersionRef`
- `truthBasisHash`
- `projectionFreshnessEnvelopeRef`
- reason refs

Every state mutation refreshes the projection immediately.

## Offer-session and waitlist scope integration

The booking application exposes one reservation scope family for:

- `offer_session`
- `waitlist_offer`

Offer-session scope resolution now derives from the frozen `OfferSession.slotSetSnapshotRef` instead of re-entering slot-search execution rules after selection. That keeps reservation truth lawful when the booking case has already moved from `offers_ready` to `selecting`, `revalidating`, or later states.

Waitlist scope remains typed-input driven until `290` lands the full waitlist engine, but it already points at the same canonical reservation authority and the same key serializer.

## Mutation surfaces

The command-api wrapper now exposes:

- `createOrRefreshSoftSelection`
- `acquireOrRefreshHold`
- `markPendingConfirmation`
- `markConfirmed`
- `releaseReservation`
- `expireReservation`
- `markDisputed`
- `queryReservationTruth`
- `sweepExpiredReservations`

Each mutation persists:

- the updated reservation row
- the refreshed truth projection
- the active or terminal fence record
- the current booking reservation scope
- one append-only journal entry
- one replay record for duplicate command-action collapse

## Expiry and post-confirmation timing

Two timing details are now explicit in the authority layer:

1. post-confirmation release or dispute may not silently move `supplierObservedAt` past the preserved confirmation timestamp
2. expiry sweep may mark a reservation expired after the real `expiresAt`, but that later sweep time is carried as validation evidence rather than rewriting the reservation into an impossible timeline where `expiresAt < supplierObservedAt`

This keeps the Phase 0 reservation invariants intact while still allowing later observations to settle truth.

## Event ownership

`286` emits the canonical capacity events already declared in the registry:

- `capacity.reservation.created`
- `capacity.reservation.soft_selected`
- `capacity.reservation.held`
- `capacity.reservation.pending_confirmation`
- `capacity.reservation.confirmed`
- `capacity.reservation.released`
- `capacity.reservation.expired`
- `capacity.reservation.disputed`
- `capacity.reservation.truth.updated`

The booking wrapper does not mint booking-local event aliases for reservation state.

## Boundaries kept explicit

This slice intentionally does not own:

- booking commit execution from `287`
- appointment confirmation truth from later commit tracks
- full waitlist object execution from `290`
- staff operations APIs from `291`
- browser-facing booking UI

Those later tracks must reuse the authority, scope, and truth-projection pathway published here instead of forking it.
