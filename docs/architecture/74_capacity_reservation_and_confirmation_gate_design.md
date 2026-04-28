# 74 Capacity Reservation And Confirmation Gate Design

`par_074` publishes the authoritative reservation-truth substrate for booking, hub, and pharmacy work. The generated pack freezes 8 canonical simulator scenarios, 3 gate-backed confirmation cases, and one browser lab that proves the truth-in-advertising rules at the UI boundary.

## Core law

- `CapacityReservation` is the canonical reservation state holder. Soft focus, exclusive holds, pending confirmation, final confirmation, release, expiry, and dispute stay distinct and durable.
- `ReservationTruthProjection` is the sole user-visible authority for exclusivity language, hold countdowns, and truthful nonexclusive wording.
- `ExternalConfirmationGate` is mandatory whenever external truth is async, weak, or manual.

## Truth boundaries

`soft_selected` is only focus posture. It may preserve the active row or card but may never imply ownership, exclusivity, or a reserved-for-you timer. `exclusive_held` exists only while the underlying reservation is genuinely held under `commitMode = exclusive_hold` and carries the real hold expiry.

`pending_confirmation` is not a soft synonym for success. It is a durable waiting posture that must remain visible until authoritative confirmation clears or the gate moves to `disputed` or `expired`.

## Persistence and simulator

The runtime seam persists three artifacts:

- `capacity_reservations`
- `reservation_truth_projections`
- `external_confirmation_gates`

The deterministic simulator uses the same model law as production and covers:

- soft selection without exclusivity
- real exclusive hold with countdown
- truthful nonexclusive availability
- immediate authoritative confirmation
- pending external confirmation
- contradictory and competing evidence
- corroborated weak/manual confirmation
- expired hold degradation
