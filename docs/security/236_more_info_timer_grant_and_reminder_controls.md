# 236 More-Info Timer, Grant, and Reminder Controls

## Security boundaries

The 236 kernel binds four controls together:

1. `RequestLifecycleLease` ownership for the live more-info loop
2. `respond_more_info` access grants
3. authoritative reply-window checkpoint truth
4. transactional outbox publication

The critical rule is simple: grant expiry may narrow entry posture, but it may not redefine cycle truth.

## Grant control

- every new cycle issues one governed `respond_more_info` grant
- supersession, cancellation, response acceptance, and expiry revoke or supersede prior grants
- old grant state is visible in audit history; it is not silently overwritten
- a replacement cycle gets a new grant even if the task never leaves `awaiting_patient_info`

## Lease and stale-owner control

- more-info mutations present `ownershipEpoch`, `fencingToken`, and `currentLineageFenceEpoch`
- release on supersession, cancellation, review resume, and expiry advances the lineage fence
- stale owners fail closed through the shared lease/fence authority rather than mutating reminder state from stale memory

## Reminder control

Reminder send is allowed only when:

- the checkpoint is `open` or `reminder_due`
- the schedule is `scheduled` or `suppressed`
- reachability is not blocked
- the evaluated send time is outside quiet hours

Reminder send is forbidden once the checkpoint is:

- `late_review`
- `expired`
- `superseded`
- `settled`

## Quiet-hours control

quiet-hours suppression is explicit:

- the worker does not send immediately
- it persists `nextQuietHoursReleaseAt`
- it keeps the same schedule row authoritative
- worker restarts may re-evaluate, but they do not emit duplicate reminder effects

## Callback-fallback boundary

Blocked reachability does not degrade into silent reminder retries.

Instead the kernel:

1. marks the checkpoint `blocked_repair` when appropriate
2. suppresses reminder send
3. emits a callback-fallback seed only when reachability is blocked and governed fallback is allowed

That seed is a seam, not direct callback implementation. `243` remains the owner of the callback-case workflow.

## Outbox control

Whenever the system mutates checkpoint or schedule state and emits an external effect, it does so through one transactional outbox authority:

- `initial_delivery`
- `reminder_send`
- `callback_fallback_seed`

Each effect is keyed replay-safely from cycle ID, effect type, ordinal, and checkpoint revision.
