# 244 Clinician Message Thread And Delivery Chain

This task makes clinician messaging a first-class Phase 3 backend domain with five durable authorities:

- `ClinicianMessageThread`
- `MessageDispatchEnvelope`
- `MessageDeliveryEvidenceBundle`
- `ThreadExpectationEnvelope`
- `ThreadResolutionGate`

The canonical thread path is explicit:

`drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed`

Repair and reopen stay explicit:

- `sent -> delivery_failed | delivery_disputed -> contact_route_repair_pending -> approved -> sent`
- `closed -> reopened -> approved | awaiting_clinician_review`
- `awaiting_clinician_review -> escalated_to_callback`

## Dispatch authority

`MessageDispatchEnvelope` is the only send authority. Each envelope is immutable and keyed by:

- `threadRef`
- `threadVersionRef`
- `dispatchFenceEpoch`

Duplicate taps, worker retry, or stale browser replay reuse the existing envelope instead of creating a second live send chain. The same chain binds:

- `routeIntentBindingRef`
- `requestLifecycleLeaseRef`
- `commandActionRecordRef`
- `idempotencyRecordRef`
- `adapterDispatchAttemptRef`

## Delivery truth

Provider acceptance does not mean delivered truth. `AdapterReceiptCheckpoint` only updates transport posture on the live `MessageDispatchEnvelope`. Durable delivery posture is written only through `MessageDeliveryEvidenceBundle`.

This keeps four distinct states separate:

- transport accepted
- transport rejected
- delivery proven
- delivery disputed or failed

Late contradictory evidence is not allowed to silently replace a delivered bundle. The application rejects `delivered -> failed` overwrite attempts and requires an explicit dispute path instead.

## Patient expectation

`ThreadExpectationEnvelope` is the only patient-facing promise source. The thread does not derive patient copy from draft state, queue metadata, or provider callbacks. The envelope alone advances:

- `reply_needed`
- `awaiting_review`
- `reviewed`
- `reply_blocked`
- `delivery_repair_required`
- `closed`

Each transition publishes a fresh monotone expectation revision with one continuity reference and one fallback guidance reference.

## Reply-first routing

Patient replies land on `ClinicianMessageThread` before any broader reopen or resafety action. The reply object preserves:

- the current dispatch envelope
- the current thread version
- route family and channel
- optional provider correlation
- `classificationHint`
- `needsAssimilation`

This gives task `237` one stable hook for evidence assimilation and resafety without letting timeline refresh logic mutate thread truth.

## Terminal authority

`ThreadResolutionGate` is the only authority for:

- `await_reply`
- `review_pending`
- `repair_route`
- `escalate_to_callback`
- `reopen`
- `close`

Closure is blocked while delivery repair is required or reply resafety remains unresolved. Callback escalation emits a separate outbox effect instead of pretending the thread itself closed the request. Request closure still belongs to `LifecycleCoordinator`.

## Outbox hooks

The command-api publishes projection-safe outbox effects only:

- `projection_refresh`
- `reply_assimilation`
- `callback_escalation`

That gives later work in `246` and `247` stable inputs without pushing patient-preview truth into the aggregate itself.
