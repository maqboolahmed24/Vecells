# 237 Response Ingestion And Supervisor Churn Guard

## Operator and service expectations

`receiveMoreInfoReply` is the only supported ingress for a Phase 3 patient reply.

It performs:

1. current-cycle and checkpoint resolution
2. replay collapse by `idempotencyKey` and semantic replay key
3. disposition resolution
4. canonical assimilation and resafety for accepted replies only
5. urgent return, routine review resume, or supervisor-review hold settlement

## Replay handling

Two replay classes are expected:

- idempotent replay: same `idempotencyKey`
- semantic replay: new command id but identical payload hash for the same cycle and lineage

Both return the existing `MoreInfoResponseDisposition` and prior assimilation result instead of minting a second snapshot.

## Drift handling

If the current cycle or checkpoint drifts after receipt but before assimilation commit, the service fails closed with current-cycle drift rather than guessing which lineage should absorb the reply.

No `ResponseAssimilationRecord` is written in that case.

## Supervisor churn guard

Automatic routine queue return is suppressed when:

- more than `3` reopen/resafety cycles occur
- within a rolling `24h` window
- without a stable `screen_clear` reset or clinician-resolution event

The service appends `MoreInfoSupervisorReviewRequirement` and leaves the case explainable instead of allowing endless queue bounce.

## Investigation checklist

For a blocked or unexpected reply path, check:

- latest `MoreInfoResponseDisposition`
- `reasonCodeRefs`
- whether the current cycle drifted or was superseded
- whether the reply was classified as `contact_safety_relevant`
- whether a supervisor review requirement was created

## Transport status

Inbound patient reply transport is still simulator-backed at this stage of the repo.

The durable disposition, assimilation, and resafety kernel is production-shaped, but live portal, callback, and message ingress adapters must reuse this exact path when those provider-bound channels land.
