# 323 Hub Fallback And Reopen API

The canonical backend entry point is `createPhase5HubFallbackEngineService(...)` in `packages/domains/hub_coordination/src/phase5-hub-fallback-engine.ts`.

## Runtime entry points

### `resolveNoSlotFallback(input)`

Chooses one of:

- `alternatives`
- `callback`
- `return_to_practice`

Required inputs include:

- hub case identity and command refs
- `recordedAt`
- trusted-frontier flags
- `offerLeadMinutes`
- `callbackLeadMinutes`
- `bestTrustedFit`
- `trustGap`
- `pBreach`

Optional carry-forward:

- `alternativeOfferSessionId`
- `phase4WaitlistCarryForward`
- `newClinicalContextScore`

Result includes the chosen route, any fallback or child records, updated truth projection, any preserved provenance session or fallback card, and any loop-prevention exception or supervisor escalation.

### `linkCallbackFallback(input)`

Requires an existing `HubFallbackRecord` whose `callbackFallbackRef` is present. The operation fails closed unless the callback bridge returns:

- current `CallbackCase`
- current `CallbackExpectationEnvelope`

Success effects:

- callback child becomes offered
- fallback becomes transferred
- truth becomes `fallbackLinkState = callback_linked`
- hub case advances to `callback_offered`

### `linkReturnToPractice(input)`

Requires an existing `HubFallbackRecord` whose `returnToPracticeRef` is present. The operation fails closed unless the reopen bridge returns:

- durable reopened workflow ref
- reopened lineage case link ref

Success effects:

- return child becomes linked
- fallback becomes transferred
- truth becomes `fallbackLinkState = return_linked`
- closure becomes `closable`

### `completeHubFallback(input)`

Completion is legal only after fallback state is `transferred` or `completed`. With `closeHubCase = true`, the engine:

1. marks the fallback completed
2. releases the hub case
3. closes the hub case with an explicit `closeDecisionRef`

### `raiseHubCoordinationException(input)` and `resolveHubCoordinationException(exceptionId, resolvedAt)`

These persist or resolve typed fallback exceptions for supervisor review and audit.

## Persistence surfaces

The migration `151_phase5_hub_fallback_workflows.sql` publishes:

- `phase5_hub_fallback_records`
- `phase5_callback_fallback_records`
- `phase5_hub_return_to_practice_records`
- `phase5_hub_fallback_cycle_counters`
- `phase5_hub_fallback_supervisor_escalations`
- `phase5_hub_coordination_exceptions`

## Bridge contracts

`Phase5CallbackLinkBridge.materializeCallbackLink(...)` must return callback truth that is patient-safe now.

`Phase5PracticeReopenBridge.materializePracticeReopen(...)` must return lifecycle-safe downstream refs without letting the hub mutate practice-side lineage directly.
