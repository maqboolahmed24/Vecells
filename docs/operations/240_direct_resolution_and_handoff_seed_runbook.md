# 240 Direct Resolution And Handoff Seed Runbook

## Commands

- `GET /v1/workspace/tasks/{taskId}/direct-resolution`
- `POST /v1/workspace/tasks/{taskId}:commit-direct-resolution`
- `POST /internal/v1/workspace/tasks/{taskId}/direct-resolution/{settlementId}:publish-artifact`
- `POST /internal/v1/workspace/tasks/{taskId}:reconcile-direct-resolution-supersession`
- `POST /internal/v1/workspace/direct-resolution:drain-worker`

## Normal operator sequence

1. endpoint decision reaches the live epoch
2. required approval is satisfied when applicable
3. call `:commit-direct-resolution`
4. inspect the returned `DirectResolutionSettlement`, typed seed or intent, and `TriageOutcomePresentationArtifact`
5. drain the outbox worker or publish the artifact when operating the simulator-backed paths

## Expected outcomes by endpoint

- callback -> `CallbackCaseSeed`, patient status `callback_created`
- clinician message -> `ClinicianMessageSeed`, patient status `clinician_message_created`
- self-care -> `SelfCareConsequenceStarter`, plus `lifecycle_closure_evaluation`
- admin -> `AdminResolutionStarter`, patient status `admin_resolution_started`
- booking -> `BookingIntent` plus proposed `LineageCaseLink`
- pharmacy -> `PharmacyIntent` plus proposed `LineageCaseLink`

## Supersession response

When a new `DecisionSupersessionRecord` replaces the source epoch:

1. reconcile the stale consequence path
2. confirm prior pending outbox entries were cancelled
3. confirm the current patient status shows `recovery_required`
4. do not attempt manual downstream replay from the stale seed

## Replay expectations

- repeating `:commit-direct-resolution` for the same task plus epoch returns the existing settlement
- draining the outbox twice does not create new dispatch records
- stale recovery is idempotent for the same supersession record
