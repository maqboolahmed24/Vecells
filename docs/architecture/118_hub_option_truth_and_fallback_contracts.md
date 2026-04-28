# Hub option truth and fallback contracts

## Timer law

Only `exclusive_hold` options may show a reserved countdown. `truthful_nonexclusive` options may show a response window, but they must say the slot remains subject to live confirmation. `confirmation_pending`, `confirmed`, `callback_only`, and `diagnostic_only` options never drive hold-style urgency.

## Fallback law

- `callback_only` is an explicit continuation, not a weak promise of future supply.
- `diagnostic_only` remains visible only as provenance and never reopens writable slot posture.
- `confirmation_pending` suppresses calm booked posture until stronger supplier evidence arrives.
- `confirmed` may still coexist with acknowledgement debt; closure waits for the current practice acknowledgement generation.

## Published matrix coverage

- `hub-case-104` / `hub-opt-104-oak` -> `exclusive_hold` + `hold_expiry` :: Hold expires in 11m
- `hub-case-104` / `hub-opt-104-river` -> `truthful_nonexclusive` + `response_window` :: Reply window 40m, still subject to live confirmation
- `hub-case-104` / `hub-opt-104-callback` -> `callback_only` + `none` :: Timer suppressed until callback expectation is durably published
- `hub-case-087` / `hub-opt-087-west` -> `confirmation_pending` + `none` :: No countdown shown while confirmation is pending
- `hub-case-087` / `hub-opt-087-callback` -> `callback_only` + `none` :: Hidden until the pending commit settles or fails
- `hub-case-066` / `hub-opt-066-confirmed` -> `confirmed` + `none` :: No timer: booked truth is strong, acknowledgement debt is the active blocker
- `hub-case-052` / `hub-opt-052-callback` -> `callback_only` + `none` :: No countdown: callback truth activates only after expectation publication
- `hub-case-052` / `hub-opt-052-diagnostic` -> `diagnostic_only` + `none` :: Historical timer suppressed after slot expiry
