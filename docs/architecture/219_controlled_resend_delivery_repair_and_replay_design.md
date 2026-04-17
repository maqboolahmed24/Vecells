# 219 Controlled Resend, Delivery Repair, And Replay Design

Task: `par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations`

## Production Surface

The command-api support repair stack is implemented in `services/command-api/src/support-repair-and-replay.ts` around three runtime authorities:

- `SupportRepairChainAssembler` resolves the current `MessageDispatchEnvelope`, latest `MessageDeliveryEvidenceBundle`, latest `ThreadExpectationEnvelope`, latest `ThreadResolutionGate`, current `SupportLineageBinding`, actionable `SupportLineageScopeMember`, and governing thread/subthread tuple into one `SupportRepairChainView`.
- `SupportRepairReplayControlService` owns `SupportMutationAttempt`, `SupportActionRecord`, `SupportActionSettlement`, provider callback reconciliation, `SupportOmnichannelTimelineProjection`, `SupportActionWorkbenchProjection`, and `SupportReachabilityPostureProjection`.
- `ReplayCheckpointService` and `ReplayRestoreService` responsibilities are represented by `CommunicationReplayRecord`, `SupportReplayCheckpoint`, `SupportReplayEvidenceBoundary`, `SupportReplayDeltaReview`, `SupportReplayReleaseDecision`, `SupportReplayRestoreSettlement`, `SupportRouteIntentToken`, `SupportContinuityEvidenceProjection`, and same-shell `SupportReadOnlyFallbackProjection`.

## API Surfaces

- `POST /ops/support/tickets/:supportTicketId/communication-repair/preview`
- `POST /ops/support/tickets/:supportTicketId/communication-repair/commit`
- `POST /ops/support/tickets/:supportTicketId/replay/start`
- `POST /ops/support/tickets/:supportTicketId/replay/release`
- `GET /ops/support/tickets/:supportTicketId/timeline`
- `GET /ops/support/tickets/:supportTicketId/restore-status`

The route catalog in `services/command-api/src/service-definition.ts` publishes these surfaces with idempotency requirements for every mutating endpoint.

## Controlled Repair Algorithm

Every repair first goes through `SupportRepairChainAssembler`. The assembler rejects floating support-local truth by requiring the canonical communication chain:

1. `MessageDispatchEnvelope`
2. `MessageDeliveryEvidenceBundle`
3. `ThreadExpectationEnvelope`
4. `ThreadResolutionGate`
5. `SupportLineageBinding`
6. governed `SupportLineageScopeMember`
7. governing thread and subthread tuple hashes

For `controlled_resend`, `reissue`, `channel_change`, `callback_reschedule`, and `attachment_recovery`, the dedupe key is:

```text
supportTicketId + governingThreadTupleHash + governingSubthreadTupleHash + repairKind
```

The same tuple reuses the live `SupportMutationAttempt` until authoritative settlement, read-only fallback, or stale recovery. Duplicate clicks and worker retries return the same `SupportMutationAttempt`, `SupportActionRecord`, `SupportActionSettlement`, provider-safe metadata, and external-effect count.

A fresh repair can be committed only when the current `ThreadResolutionGate` authorizes `repair_route` or `reopen`, or the latest `MessageDeliveryEvidenceBundle` is authoritatively `failed`, `expired`, or `disputed`. Otherwise the preview/commit result remains provisional, denied, or same-shell read-only.

## Timeline And Receipt Alignment

`SupportOmnichannelTimelineProjection` is hydrated from the same chain and settlement refs as the repair attempt. While `SupportActionSettlement.result` is `awaiting_external`, `patientReceiptParity` is `provisional`; accepted provider callbacks refresh the same settlement and move parity to `authoritative`. The workbench and reachability posture are nested as typed projections so later support UI tasks can render the same state without recomputing repair truth.

## Replay Checkpointing

`POST /replay/start` creates:

- `CommunicationReplayRecord`
- `SupportReplayCheckpoint`
- `SupportReplayEvidenceBoundary`

The checkpoint preserves ticket version, ticket anchor, selected timeline anchor, mask scope, disclosure ceiling, queue anchor, route-intent token ref, projection watermark, and evidence boundary hash. Mutating controls are suspended through the timeline workbench projection.

`SupportReplayEvidenceBoundary` includes only the chain evidence available at checkpoint time. It explicitly excludes drafts, in-flight outbound attempts, later confirmations, and wider disclosure. Drafts remain in a hold outside frozen evidence and must be handled during release.

## Replay Release

`POST /replay/release` requires:

- `SupportReplayDeltaReview`
- fresh ticket version proof
- live `SupportRouteIntentToken`
- reacquired lease
- trusted `SupportContinuityEvidenceProjection`
- active current `SupportLineageBinding`
- unchanged mask scope and anchor tuple
- no pending external settlement that would alter repair truth

If all proofs pass, `SupportReplayRestoreSettlement.result` is `live_restored` and live controls are rearmed. If route intent, masking, publication, lineage, ticket version, lease, or external evidence is stale, the result is `read_only_fallback` or `awaiting_external_hold`, and a same-shell `SupportReadOnlyFallbackProjection` preserves the anchor, strongest confirmed artifact, held attempt refs, and next reacquire action.

## Atlas And Proof

The frontend proof artifact is `docs/frontend/219_support_repair_and_replay_atlas.html` in mode `Support_Replay_Control_Atlas`. The Playwright spec covers repair lifecycle, idempotency, timeline settlement alignment, replay boundary, delta review, restore/fallback, provider callback hygiene, metadata hygiene, mobile layout, reduced motion, screenshots, and ARIA snapshots.

## Reason Codes

- `SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND`
- `SUPPORT_219_REPAIR_DEDUPE_REUSED_LIVE_ATTEMPT`
- `SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT`
- `SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE`
- `SUPPORT_219_REPAIR_STALE_RECOVERABLE`
- `SUPPORT_219_REPAIR_MANUAL_HANDOFF_REQUIRED`
- `SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED`
- `SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_REJECTED`
- `SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY`
- `SUPPORT_219_REPLAY_CHECKPOINT_FROZEN`
- `SUPPORT_219_REPLAY_BOUNDARY_EXCLUDES_DRAFTS_AND_LATER_PROOF`
- `SUPPORT_219_REPLAY_RELEASE_DELTA_REVIEW_REQUIRED`
- `SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED`
- `SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK`

References:

- Twilio request validation: https://www.twilio.com/docs/usage/security#validating-requests
- SendGrid signed event webhook and OAuth controls: https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features
- Playwright ARIA snapshots: https://playwright.dev/docs/aria-snapshots
- Playwright screenshots: https://playwright.dev/docs/screenshots
