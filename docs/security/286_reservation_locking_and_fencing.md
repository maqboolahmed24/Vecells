# 286 Reservation Locking And Fencing

This slice fixes the runtime safety law for booking-facing reservation mutations.

## Short lock scope

Reservation mutation is serialized only around:

- current-fence lookup
- reservation compare-and-set
- projection refresh
- fence update

The serializer does not stay open across browser work, supplier retries, notification fan-out, or downstream publication.

## Strict fence validation

Every mutating command that targets an existing reservation must present the latest active fence token.

Older writers are rejected.
The authority does not silently promote or overwrite a newer fence.

## Strict reservation-version validation

Every mutating command may also present the latest `reservationVersionRef`.
If it does, the authority requires exact equality with the current reservation version.

This is fail-closed, not best-effort.

## No exclusivity without a real hold

`soft_selected` is focus or selection posture only.

It may preserve:

- active card focus
- selected candidate context
- bounded TTL
- one current scope object

It may not imply:

- exclusivity
- hold countdown
- supplier commit authority

Exclusive visible posture is allowed only when:

- reservation state is `held`, `pending_confirmation`, or `confirmed`
- commit mode is `exclusive_hold`
- the provider binding actually publishes `reservationSemantics = exclusive_hold`

## Truthful nonexclusive posture

When the active provider binding is `truthful_nonexclusive`, the projection remains nonexclusive even after selection.

The application keeps the same canonical reservation row and scope, but the projection stays in the truthful-nonexclusive family.

## Countdown law

`countdownMode = hold_expiry` is lawful only when:

- the reservation is really `held`
- the commit mode is `exclusive_hold`
- the projection has a real exclusive-until timestamp

Offer-session TTL is never reused as hold authority.

## Drift degradation

Projection truth degrades immediately when one of these drifts:

- scope tuple hash
- provider adapter binding hash
- capability tuple hash
- governing object version ref
- truth-basis hash

Reads are allowed to stay diagnostic, but they may not stay calm when the basis is stale.

## Terminal-state handling

Release, expiry, and dispute are terminal reservation truths.
The booking wrapper keeps append-only reservation and journal history while moving the current scope to a terminal posture.

Prior state is preserved for audit.
Current visible truth is not allowed to linger on the pre-terminal posture.

## Waitlist throughput law

Waitlist does not get a separate reservation pathway.
The same canonical key serializer is used for:

- offer-session hold attempts
- waitlist-offer hold attempts
- later commit serialization

That preserves the Phase 0 rule that a single capacity key may not quietly carry multiple exclusive truths at once.
