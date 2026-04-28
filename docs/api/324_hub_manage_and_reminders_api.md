# 324 Hub Manage And Reminders API

The 324 backend is exposed as `createPhase5ReminderManageVisibilityService(...)` in `/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-reminders-manage-visibility-engine.ts`.

## Reminder APIs

### `createOrRefreshReminderPlan(input)`

Creates or refreshes the current `NetworkReminderPlan` for the booked hub appointment.

Required fields:

- `hubCoordinationCaseId`
- `scheduledFor`
- `recordedAt`
- timeline-binding refs: `threadId`, `conversationClusterRef`, `conversationSubthreadRef`, `communicationEnvelopeRef`
- reminder routing refs: `templateSetRef`, `templateVersionRef`, `routeProfileRef`, `channel`, `payloadRef`
- trust refs: `contactRouteRef`, `contactRouteVersionRef`, `currentContactRouteSnapshotRef`, `reachabilityDependencyRef`, `currentReachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`
- recovery refs: `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`

Returns:

- `reminderPlan`
- `reminderSchedule | null`
- `timelinePublication | null`
- `replayed`

### `dispatchReminderSchedule(input)`

Dispatches one planned schedule through the strict adapter seam for `sms`, `email`, or `app_inbox`.

Returns:

- `reminderPlan`
- `reminderSchedule`
- `deliveryEvidence`
- `timelinePublication`

### `recordReminderDeliveryEvidence(input)`

Settles asynchronous reminder-delivery truth. Failed, expired, or disputed evidence can reopen acknowledgement debt and refresh the current `PracticeVisibilityProjection`.

Returns:

- `reminderPlan`
- `reminderSchedule`
- `deliveryEvidence`
- `timelinePublication`
- `deltaRecord | null`
- `visibilityProjection | null`

## Manage APIs

### `compileNetworkManageCapabilities(input)`

Compiles one current `NetworkManageCapabilities` lease for the current hub appointment.

Notable inputs:

- visibility: `visibilityEnvelopeVersionRef`
- session and subject fences: `sessionFenceToken`, `subjectFenceToken`, `sessionEpochRef`, `subjectBindingVersionRef`
- route and publication posture: `routeIntentRef`, `manifestVersionRef`
- lease controls: `channelReleaseFreezeState`, `capabilityLeaseMinutes`, `sessionCurrent`, `subjectBindingCurrent`, `publicationCurrent`

Returns:

- `capabilities`
- `policyEvaluation`
- `replayed`

### `executeHubManageAction(input)`

Returns one same-shell `HubManageSettlement` for `cancel`, `reschedule`, `callback_request`, or `details_update`.

Required lineage fields:

- `hubCoordinationCaseId`
- `networkManageCapabilitiesId`
- `actionScope`
- `idempotencyKey`
- `routeIntentRef`
- `commandActionRecordRef`
- `commandSettlementRecordRef`
- `transitionEnvelopeRef`
- `surfaceRouteContractRef`
- `surfacePublicationRef`
- `runtimePublicationBundleRef`
- `releaseRecoveryDispositionRef`

Returns:

- `settlement`
- `capabilities`
- `deltaRecord | null`
- `visibilityProjection | null`
- `replayed`

## Projection API

### `refreshPracticeVisibilityProjection(input)`

Re-materialises the current minimum-necessary `PracticeVisibilityProjection` for the origin practice.

Required inputs:

- `hubCoordinationCaseId`
- `visibilityEnvelopeId`
- `recordedAt`

Returns:

- `projection`
- `policyEvaluation`

### `queryCurrentReminderManageVisibilityState(hubCoordinationCaseId)`

Returns the current joined runtime slice:

- `reminderPlan`
- `reminderSchedules`
- `latestReminderDeliveryEvidence`
- `currentManageCapabilities`
- `latestManageSettlement`
- `practiceVisibilityProjection`
- `latestTimelinePublication`
- `latestDeltaRecord`
- `appointment`
- `truthProjection`
