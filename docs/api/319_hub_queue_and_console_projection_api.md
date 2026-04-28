# 319 Hub Queue And Console Projection API

## Public service

`createPhase5HubQueueEngineService()` exports:

- `publishHubQueueOrder(input: PublishHubQueueOrderInput)`
- `replayHubQueueOrder({ rankSnapshotId })`

## Publish input

`PublishHubQueueOrderInput` requires:

- `hubCoordinationCaseIds[]`
- `evaluatedAt`

Optional inputs:

- `queueRef`
- `continuity`
- `caseBindings[]`
- `sourceFactCutRef`
- `trustInputRefs[]`
- `applyPolicy`
- `sourceRefs[]`

`caseBindings[]` is where later queue-adjacent tracks inject authoritative extras such as:

- patient-choice expiry
- callback-transfer blockage
- reservation bindings for option cards
- blocker stubs and selected-anchor continuity refs

## Persisted object families

The service writes:

- `HubQueueRankPlanSnapshot`
- `HubFairnessCycleStateSnapshot`
- `HubQueueRankSnapshot`
- `HubQueueRiskExplanationSnapshot`
- `HubQueueRankEntrySnapshot`
- `HubQueueTimerSnapshot`
- `QueueChangeBatchSnapshot`
- `HubQueueWorkbenchProjectionSnapshot`
- `HubCaseConsoleProjectionSnapshot`
- `HubOptionCardProjectionSnapshot`
- `HubPostureProjectionSnapshot`
- `HubEscalationBannerProjectionSnapshot`
- `HubConsoleConsistencyProjectionSnapshot`
- `HubQueueReplayFixtureSnapshot`

## Banner types

`HubEscalationBannerProjection.bannerType` is constrained to:

- `too_urgent`
- `no_trusted_supply`
- `practice_ack_overdue`
- `supplier_drift`
- `stale_owner`
- `callback_transfer_blocked`

## Timer types

`HubQueueTimerSnapshot.timerType` is constrained to:

- `candidate_refresh`
- `patient_choice_expiry`
- `required_window_breach`
- `too_urgent_for_network`
- `practice_notification_overdue`

## Replay contract

`replayHubQueueOrder` rebuilds the queue from the stored replay fixture and returns:

- `matchesStoredSnapshot`
- `mismatchFields[]`
- `originalSnapshot`

The runtime validator uses replay to prove the queue order and overload posture are rebuildable from durable inputs.
