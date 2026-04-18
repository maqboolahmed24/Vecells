# 263 Algorithm Alignment Notes

## Source order

1. `blueprint/callback-and-clinician-messaging-loop.md`
2. `blueprint/staff-workspace-interface-architecture.md`
3. `blueprint/phase-3-the-human-checkpoint.md`
4. `blueprint/phase-0-the-foundation-protocol.md`
5. validated frontend shells from `255` to `262`

## Lifecycle mapping

- `CallbackCase` drives the visible callback state. The worklist never invents local callback status.
- `CallbackIntentLease` decides whether schedule, reschedule, cancel, or initiate-attempt controls are writable.
- `CallbackAttemptRecord` is the only visible attempt ladder truth. A live attempt must reuse the current fence rather than mint a second row.
- `CallbackExpectationEnvelope` is the only promise surface. Local clocks and optimistic provider timing are not used to create callback wording.
- `CallbackOutcomeEvidenceBundle` decides whether the outcome stage is still missing, partial, or durable.
- `CallbackResolutionGate` decides whether retry, complete, cancel, escalate, or repair is legal.

## Mandatory closures

- Close the duplicate dial gap: the initiate control disables after one live attempt and the ladder keeps one live attempt fence.
- Close the voicemail-means-done gap: voicemail copy stays explicitly provisional until evidence is durable and the gate allows the next action.
- Close the local-timer-promise gap: promise windows and patient wording stay bound to the current expectation envelope revision.
- Close the hidden route repair gap: repair moves into the dominant stage whenever route health is `repair_required`.
- Close the unsupported-terminal-action gap: the record button stays locked until the selected outcome has the required evidence set and the stage is writable.

## UI state map

- `scheduled` + `live_ready` + `current` + `awaiting_attempt` -> initiate governed attempt
- `awaiting_retry` + durable no-answer evidence -> retry or escalate, never calm closure
- `voicemail_left` + partial evidence -> outcome capture stays writable but terminal calmness stays fenced
- `contact_route_repair_pending` + `repair_required` -> stale promise is revoked and repair dominates the stage
- `stale_recoverable` -> preserve list, selected row, selected attempt anchor, and stage while freezing mutation
- `blocked` -> preserve attempt ladder and promise context while disabling writable outcome actions
