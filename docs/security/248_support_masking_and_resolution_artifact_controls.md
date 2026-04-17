# 248 Support Masking And Resolution Artifact Controls

## Security and disclosure rules

- `SupportLineageBinding` remains the only authority allowed to join the ticket shell to the callback or message failure chain
- the current mask scope and disclosure ceiling are copied onto every new `SupportLineageArtifactBinding`
- support convenience never widens patient-visible or cross-role visibility
- stale ticket version, stale binding hash, or stale governing tuple fails closed into `stale_recoverable`

## Durable summary control

Durable support summaries require `SupportLineageArtifactBinding`.

That rule applies to:

- resend notes
- callback repair notes
- manual-handoff notes
- final `SupportResolutionSnapshot`

Local support acknowledgement does not calm the patient thread. Only authoritative settlement on the same communication chain may widen or settle outward-facing posture.

## Settlement separation

`SupportActionSettlement` keeps these states separate:

- `localAckState`
- `processingAcceptanceState`
- `externalObservationState`
- `authoritativeOutcomeState`

This prevents a support-local click, draft note, or queued handoff from appearing as delivered, reviewed, repaired, or settled communication truth.

## Explicit manual handoff rule

`manual_handoff_required` is explicit and provenance-bound. It is not interchangeable with `applied`, and it may not become durable without accepted transfer posture plus artifact provenance for the cited handoff summary.
