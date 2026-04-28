# 74 Reservation Truth And Confirmation Rules

The frozen rule set below is the law later booking, hub, and pharmacy surfaces must respect. This pack currently carries 20 explicit validator rows and 10 evidence atoms across the canonical simulator.

## Fail-closed rules

- `soft_selected` may not be rendered or persisted as exclusivity. It is focus posture only.
- Countdown copy is legal only when a real held reservation exposes the real hold expiry.
- `pending_confirmation` may preserve the selected claim, but it may not widen into final booked or referred reassurance.
- Weak or manual confirmation may not settle without every required hard match, `confirmationConfidence >= tauConfirm`, `competingGateMargin >= deltaConfirm`, and at least two independent source families.
- Contradictory evidence, failed hard matches, or competing ambiguity below `deltaConfirm` force `disputed`.
- `released`, `expired`, and `disputed` remain durable, visible outcomes for that claim and may not flatten into success.

## Gate thresholds

- `tauHold = 0.55`
- `tauConfirm = 0.82`
- `deltaConfirm = 0.18`
- `weakManualMinSourceFamilies = 2`

## Simulator contract

- Strong-path immediate confirmation may settle without an external gate only when authoritative provider proof already exists.
- Moderate async confirmation remains pending with a visible gate until hard matches and thresholds clear.
- Weak/manual dispatch paths remain blocked until independent corroboration arrives.
- Contradictory or competing evidence remains visible in the gate and blocks closure.
